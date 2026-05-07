'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db, getLectureById, incrementLectureViews, updateUserProgress, addCoins } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function LecturePage() {
  const { id } = useParams();
  const { user, isGuest } = useAuth();
  const router = useRouter();
  const [lecture, setLecture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);

  useEffect(() => {
    if (!user && !isGuest) {
      router.push('/login');
      return;
    }
    fetchLecture();
  }, [id, user]);

  const fetchLecture = async () => {
    try {
      const lectureData = await getLectureById(id);
      setLecture(lectureData);
      
      // Increment views
      await incrementLectureViews(id);
      
      // Get user progress
      if (user) {
        const progressRef = doc(db, 'progress', `${user.uid}_${id}`);
        const progressSnap = await getDoc(progressRef);
        if (progressSnap.exists()) {
          setProgress(progressSnap.data().watchTime || 0);
        }
        
        // Check for quiz
        const quizRef = doc(db, 'quizzes', id);
        const quizSnap = await getDoc(quizRef);
        if (quizSnap.exists()) {
          setQuiz({ id: quizSnap.id, ...quizSnap.data() });
        }
      }
    } catch (error) {
      console.error('Error fetching lecture:', error);
      toast.error('حدث خطأ في تحميل المحاضرة');
    } finally {
      setLoading(false);
    }
  };

  const handleProgressUpdate = async (watchTime) => {
    if (!user) return;
    setProgress(watchTime);
    await updateUserProgress(user.uid, id, watchTime, watchTime >= 100);
    
    if (watchTime >= 100 && progress < 100) {
      // Give coins for completing lecture
      await addCoins(user.uid, 50, `Completed lecture: ${lecture?.title}`);
      toast.success('🎉 مبروك! حصلت على 50 عملة كيميائية لإكمال المحاضرة');
    }
  };

  const handleQuizSubmit = async () => {
    if (!quiz) return;
    
    let correct = 0;
    quiz.questions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctAnswer) {
        correct++;
      }
    });
    
    const score = (correct / quiz.questions.length) * 100;
    setQuizScore(score);
    setQuizSubmitted(true);
    
    if (score >= 70) {
      // Save quiz result
      const quizResultRef = doc(db, 'quiz_results', `${user.uid}_${id}`);
      await updateDoc(quizResultRef, {
        score,
        completedAt: new Date(),
        answers: quizAnswers
      }, { merge: true });
      
      // Give coins
      const coinsEarned = Math.floor(score);
      await addCoins(user.uid, coinsEarned, `Completed quiz: ${lecture?.title}`);
      toast.success(`🎉 مبروك! حصلت على ${coinsEarned} عملة كيميائية`);
    } else {
      toast.error(`درجتك ${score}% - تحتاج 70% للنجاح. حاول مرة أخرى!`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل المحاضرة...</p>
        </div>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">المحاضرة غير موجودة</h2>
          <Link href="/lectures">
            <button className="px-6 py-2 bg-cyan-500 text-white rounded-lg">العودة للمحاضرات</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Progress Bar */}
        {user && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>تقدمك في المحاضرة</span>
              <span>{Math.floor(progress)}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}
        
        {/* Video Player */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-xl mb-8">
          <div className="relative pb-[56.25%]">
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${lecture.videoId}?enablejsapi=1`}
              title={lecture.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={(e) => {
                // Track video progress
                const iframe = e.target;
                // YouTube API integration would go here
              }}
            />
          </div>
          
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-full text-sm">
                {lecture.chapter || 'عام'}
              </span>
              <span className="text-gray-500 text-sm">👁️ {lecture.views || 0} مشاهدة</span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-4">
              {lecture.title}
            </h1>
            
            {lecture.pdfUrl && (
              <a href={lecture.pdfUrl} target="_blank" rel="noopener noreferrer">
                <button className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
                  📄 تحميل PDF الشرح
                </button>
              </a>
            )}
          </div>
        </div>
        
        {/* Quiz Section */}
        {quiz && !showQuiz && !quizSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl mb-8"
          >
            <div className="text-center">
              <div className="text-5xl mb-4">📝</div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                اختبر فهمك
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                جاوب على الأسئلة التالية لتحصل على عملات إضافية
              </p>
              <button
                onClick={() => setShowQuiz(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold"
              >
                ابدأ الكويز 🚀
              </button>
            </div>
          </motion.div>
        )}
        
        {/* Quiz Questions */}
        {showQuiz && !quizSubmitted && quiz && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              📝 كويز: {quiz.title || lecture.title}
            </h2>
            
            <div className="space-y-6">
              {quiz.questions?.map((q, idx) => (
                <div key={idx} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <p className="font-semibold text-gray-800 dark:text-white mb-3">
                    {idx + 1}. {q.question}
                  </p>
                  <div className="space-y-2 pr-4">
                    {q.options?.map((option, optIdx) => (
                      <label key={optIdx} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name={`q${idx}`}
                          value={option}
                          onChange={(e) => setQuizAnswers({ ...quizAnswers, [idx]: e.target.value })}
                          className="w-4 h-4 text-cyan-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={handleQuizSubmit}
              className="mt-6 w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold"
            >
              تأكيد الإجابات 🎯
            </button>
          </motion.div>
        )}
        
        {/* Quiz Result */}
        {quizSubmitted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-2xl p-6 shadow-xl mb-8 text-center ${
              quizScore >= 70 
                ? 'bg-green-500/10 border-2 border-green-500'
                : 'bg-red-500/10 border-2 border-red-500'
            }`}
          >
            <div className="text-6xl mb-4">
              {quizScore >= 70 ? '🎉' : '😢'}
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {quizScore >= 70 ? 'مبروك! اجتزت الكويز' : 'للأسف لم تجتز الكويز'}
            </h2>
            <p className="text-lg mb-4">
              درجتك: {quizScore}%
            </p>
            {quizScore >= 70 ? (
              <p className="text-green-600 dark:text-green-400">
                لقد حصلت على {Math.floor(quizScore)} عملة كيميائية!
              </p>
            ) : (
              <button
                onClick={() => {
                  setShowQuiz(false);
                  setQuizSubmitted(false);
                  setQuizAnswers({});
                }}
                className="px-6 py-2 bg-cyan-500 text-white rounded-lg"
              >
                إعادة المحاولة
              </button>
            )}
          </motion.div>
        )}
        
        {/* Related Lectures */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            📚 محاضرات مقترحة
          </h3>
          <Link href="/lectures">
            <button className="text-cyan-500 hover:underline">
              عرض جميع المحاضرات →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
