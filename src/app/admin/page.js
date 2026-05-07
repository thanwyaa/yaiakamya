'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db, getAllUsers, toggleBlockUser, updateUserCoins, addLecture, deleteLecture } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddLecture, setShowAddLecture] = useState(false);
  const [showAddQuiz, setShowAddQuiz] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalLectures: 0,
    totalQuizzes: 0,
    totalCoins: 0,
    activeToday: 0
  });

  const [newLecture, setNewLecture] = useState({
    title: '',
    videoId: '',
    chapter: '',
    pdfUrl: ''
  });

  const [newQuiz, setNewQuiz] = useState({
    title: '',
    lectureId: '',
    questions: []
  });

  const [newQuestion, setNewQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: ''
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
      toast.error('غير مصرح لك بالدخول إلى لوحة التحكم');
      return;
    }
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin, authLoading]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch users
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);

      // Fetch lectures
      const lecturesSnap = await getDocs(query(collection(db, 'lectures'), orderBy('createdAt', 'desc')));
      const lecturesData = lecturesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLectures(lecturesData);

      // Fetch quizzes
      const quizzesSnap = await getDocs(collection(db, 'quizzes'));
      const quizzesData = quizzesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQuizzes(quizzesData);

      // Calculate stats
      const students = usersData.filter(u => u.role === 'student');
      const totalCoins = students.reduce((sum, s) => sum + (s.coins || 0), 0);
      
      setStats({
        totalStudents: students.length,
        totalLectures: lecturesData.length,
        totalQuizzes: quizzesData.length,
        totalCoins: totalCoins,
        activeToday: Math.floor(Math.random() * 50) + 10 // تقريبي
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLecture = async () => {
    if (!newLecture.title || !newLecture.videoId) {
      toast.error('الرجاء إدخال عنوان المحاضرة ومعرف الفيديو');
      return;
    }

    try {
      await addLecture(newLecture);
      toast.success('تم إضافة المحاضرة بنجاح');
      setShowAddLecture(false);
      setNewLecture({ title: '', videoId: '', chapter: '', pdfUrl: '' });
      fetchAllData();
    } catch (error) {
      toast.error('حدث خطأ في إضافة المحاضرة');
    }
  };

  const handleDeleteLecture = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذه المحاضرة؟')) {
      try {
        await deleteLecture(id);
        toast.success('تم حذف المحاضرة');
        fetchAllData();
      } catch (error) {
        toast.error('حدث خطأ في الحذف');
      }
    }
  };

  const handleToggleBlock = async (userId, currentStatus) => {
    try {
      await toggleBlockUser(userId, !currentStatus);
      toast.success(currentStatus ? 'تم فك الحظر' : 'تم حظر المستخدم');
      fetchAllData();
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const handleUpdateCoins = async (userId, newCoins) => {
    try {
      await updateUserCoins(userId, parseInt(newCoins));
      toast.success('تم تحديث العملات');
      fetchAllData();
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const handleAddQuiz = async () => {
    if (!newQuiz.title || newQuiz.questions.length === 0) {
      toast.error('الرجاء إدخال عنوان الكويز والأسئلة');
      return;
    }

    try {
      await addDoc(collection(db, 'quizzes'), {
        ...newQuiz,
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });
      toast.success('تم إضافة الكويز بنجاح');
      setShowAddQuiz(false);
      setNewQuiz({ title: '', lectureId: '', questions: [] });
      fetchAllData();
    } catch (error) {
      toast.error('حدث خطأ في إضافة الكويز');
    }
  };

  const addQuestionToQuiz = () => {
    if (!newQuestion.question || newQuestion.options.some(opt => !opt) || !newQuestion.correctAnswer) {
      toast.error('الرجاء إدخال السؤال والإجابات');
      return;
    }
    setNewQuiz({
      ...newQuiz,
      questions: [...newQuiz.questions, newQuestion]
    });
    setNewQuestion({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: ''
    });
    toast.success('تم إضافة السؤال');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4"></div>
          <p className="text-white">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl p-8 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            👑 لوحة تحكم الأدمن
          </h1>
          <p className="text-white/90">مرحباً {user?.name || 'أدمن'} | إدارة كاملة للمنصة</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { id: 'dashboard', label: '📊 لوحة المعلومات', icon: '📊' },
            { id: 'users', label: '👥 إدارة الطلاب', icon: '👥' },
            { id: 'lectures', label: '📚 إدارة المحاضرات', icon: '📚' },
            { id: 'quizzes', label: '📝 إدارة الكويزات', icon: '📝' },
            { id: 'stats', label: '📈 الإحصائيات', icon: '📈' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="text-4xl mb-3">👨‍🎓</div>
                <div className="text-3xl font-bold text-white">{stats.totalStudents}</div>
                <div className="text-gray-400">إجمالي الطلاب</div>
              </div>
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="text-4xl mb-3">📚</div>
                <div className="text-3xl font-bold text-white">{stats.totalLectures}</div>
                <div className="text-gray-400">إجمالي المحاضرات</div>
              </div>
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="text-4xl mb-3">📝</div>
                <div className="text-3xl font-bold text-white">{stats.totalQuizzes}</div>
                <div className="text-gray-400">إجمالي الكويزات</div>
              </div>
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="text-4xl mb-3">🪙</div>
                <div className="text-3xl font-bold text-white">{stats.totalCoins}</div>
                <div className="text-gray-400">إجمالي العملات</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">⚡ إجراءات سريعة</h3>
                <div className="space-y-3">
                  <button onClick={() => setActiveTab('lectures')} className="w-full text-right px-4 py-3 bg-cyan-500/20 rounded-lg text-cyan-400 hover:bg-cyan-500/30 transition">
                    📚 إضافة محاضرة جديدة
                  </button>
                  <button onClick={() => setActiveTab('quizzes')} className="w-full text-right px-4 py-3 bg-purple-500/20 rounded-lg text-purple-400 hover:bg-purple-500/30 transition">
                    📝 إضافة كويز جديد
                  </button>
                  <button onClick={() => setActiveTab('users')} className="w-full text-right px-4 py-3 bg-green-500/20 rounded-lg text-green-400 hover:bg-green-500/30 transition">
                    👥 إدارة الطلاب
                  </button>
                </div>
              </div>

              {/* Top Students */}
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">🏆 أفضل 5 طلاب</h3>
                <div className="space-y-3">
                  {users.filter(u => u.role === 'student').sort((a, b) => (b.coins || 0) - (a.coins || 0)).slice(0, 5).map((student, idx) => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}</span>
                        <span className="text-white">{student.name || student.email}</span>
                      </div>
                      <div className="text-yellow-400">🪙 {student.coins || 0}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Users Management Tab */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">👥 إدارة الطلاب</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="border-b border-white/20">
                  <tr>
                    <th className="p-3 text-white">الطالب</th>
                    <th className="p-3 text-white">البريد الإلكتروني</th>
                    <th className="p-3 text-white">العملات</th>
                    <th className="p-3 text-white">الحالة</th>
                    <th className="p-3 text-white">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => u.role === 'student').map((student) => (
                    <tr key={student.id} className="border-b border-white/10">
                      <td className="p-3 text-gray-300">{student.name || 'غير محدد'}</td>
                      <td className="p-3 text-gray-300">{student.email}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          defaultValue={student.coins || 0}
                          onBlur={(e) => handleUpdateCoins(student.id, e.target.value)}
                          className="w-24 px-2 py-1 bg-gray-700 rounded text-white text-center"
                        />
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${student.isBlocked ? 'bg-red-500' : 'bg-green-500'}`}>
                          {student.isBlocked ? 'محظور' : 'نشط'}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleBlock(student.id, student.isBlocked)}
                          className={`px-3 py-1 rounded text-sm transition ${
                            student.isBlocked ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600'
                          } text-white`}
                        >
                          {student.isBlocked ? 'إلغاء الحظر' : 'حظر'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Lectures Management Tab */}
        {activeTab === 'lectures' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Add Lecture Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddLecture(!showAddLecture)}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg transition"
              >
                + إضافة محاضرة جديدة
              </button>
            </div>

            {/* Add Lecture Form */}
            {showAddLecture && (
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">➕ إضافة محاضرة</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="عنوان المحاضرة"
                    className="px-4 py-2 bg-gray-800 rounded-lg text-white border border-gray-700 focus:border-cyan-500 outline-none"
                    value={newLecture.title}
                    onChange={(e) => setNewLecture({ ...newLecture, title: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="YouTube Video ID"
                    className="px-4 py-2 bg-gray-800 rounded-lg text-white border border-gray-700 focus:border-cyan-500 outline-none"
                    value={newLecture.videoId}
                    onChange={(e) => setNewLecture({ ...newLecture, videoId: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="الباب (مثال: الباب الأول)"
                    className="px-4 py-2 bg-gray-800 rounded-lg text-white border border-gray-700 focus:border-cyan-500 outline-none"
                    value={newLecture.chapter}
                    onChange={(e) => setNewLecture({ ...newLecture, chapter: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="رابط PDF (اختياري)"
                    className="px-4 py-2 bg-gray-800 rounded-lg text-white border border-gray-700 focus:border-cyan-500 outline-none"
                    value={newLecture.pdfUrl}
                    onChange={(e) => setNewLecture({ ...newLecture, pdfUrl: e.target.value })}
                  />
                </div>
                <div className="mt-4 flex gap-3">
                  <button onClick={handleAddLecture} className="px-6 py-2 bg-green-500 text-white rounded-lg">
                    حفظ المحاضرة
                  </button>
                  <button onClick={() => setShowAddLecture(false)} className="px-6 py-2 bg-gray-600 text-white rounded-lg">
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {/* Lectures List */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">📚 قائمة المحاضرات</h3>
              <div className="space-y-3">
                {lectures.map((lecture) => (
                  <div key={lecture.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h4 className="font-semibold text-white">{lecture.title}</h4>
                        <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">{lecture.chapter}</span>
                        <span className="text-gray-400 text-xs">👁️ {lecture.views || 0}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteLecture(lecture.id)}
                      className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Quizzes Management Tab */}
        {activeTab === 'quizzes' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddQuiz(!showAddQuiz)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition"
              >
                + إضافة كويز جديد
              </button>
            </div>

            {showAddQuiz && (
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">➕ إضافة كويز</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="عنوان الكويز"
                    className="w-full px-4 py-2 bg-gray-800 rounded-lg text-white border border-gray-700 focus:border-purple-500 outline-none"
                    value={newQuiz.title}
                    onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                  />
                  <select
                    className="w-full px-4 py-2 bg-gray-800 rounded-lg text-white border border-gray-700 focus:border-purple-500 outline-none"
                    value={newQuiz.lectureId}
                    onChange={(e) => setNewQuiz({ ...newQuiz, lectureId: e.target.value })}
                  >
                    <option value="">اختر المحاضرة المرتبطة</option>
                    {lectures.map(lecture => (
                      <option key={lecture.id} value={lecture.id}>{lecture.title}</option>
                    ))}
                  </select>

                  {/* Add Question Section */}
                  <div className="border-t border-white/20 pt-4 mt-4">
                    <h4 className="text-lg font-semibold text-white mb-3">➕ إضافة سؤال</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="السؤال"
                        className="w-full px-4 py-2 bg-gray-800 rounded-lg text-white"
                        value={newQuestion.question}
                        onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                      />
                      {newQuestion.options.map((opt, idx) => (
                        <input
                          key={idx}
                          type="text"
                          placeholder={`الاختيار ${idx + 1}`}
                          className="w-full px-4 py-2 bg-gray-800 rounded-lg text-white"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...newQuestion.options];
                            newOpts[idx] = e.target.value;
                            setNewQuestion({ ...newQuestion, options: newOpts });
                          }}
                        />
                      ))}
                      <select
                        className="w-full px-4 py-2 bg-gray-800 rounded-lg text-white"
                        value={newQuestion.correctAnswer}
                        onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}
                      >
                        <option value="">الإجابة الصحيحة</option>
                        {newQuestion.options.map((opt, idx) => opt && <option key={idx} value={opt}>{opt}</option>)}
                      </select>
                      <button onClick={addQuestionToQuiz} className="px-4 py-2 bg-green-500 text-white rounded-lg">
                        إضافة السؤال
                      </button>
                    </div>
                  </div>

                  {/* Questions List */}
                  {newQuiz.questions.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-lg font-semibold text-white mb-2">الأسئلة المضافة ({newQuiz.questions.length})</h4>
                      {newQuiz.questions.map((q, idx) => (
                        <div key={idx} className="p-3 bg-gray-800 rounded-lg mb-2">
                          <p className="text-white">{idx + 1}. {q.question}</p>
                          <p className="text-green-400 text-sm">الإجابة الصحيحة: {q.correctAnswer}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <button onClick={handleAddQuiz} className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold">
                    حفظ الكويز
                  </button>
                </div>
              </div>
            )}

            {/* Quizzes List */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">📝 قائمة الكويزات</h3>
              <div className="space-y-3">
                {quizzes.map((quiz) => (
                  <div key={quiz.id} className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white">{quiz.title}</h4>
                        <p className="text-gray-400 text-sm">{quiz.questions?.length || 0} سؤال</p>
                      </div>
                      <button
                        onClick={async () => {
                          if (confirm('هل أنت متأكد من حذف هذا الكويز؟')) {
                            await deleteDoc(doc(db, 'quizzes', quiz.id));
                            toast.success('تم حذف الكويز');
                            fetchAllData();
                          }
                        }}
                        className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">📊 توزيع المحاضرات</h3>
              <div className="space-y-3">
                {lectures.reduce((acc, lecture) => {
                  const chapter = lecture.chapter || 'أخرى';
                  acc[chapter] = (acc[chapter] || 0) + 1;
                  return acc;
                }, {}).map((count, chapter) => (
                  <div key={chapter} className="flex items-center justify-between">
                    <span className="text-gray-300">{chapter}</span>
                    <div className="flex-1 mx-4 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${(count / lectures.length) * 100}%` }}></div>
                    </div>
                    <span className="text-white font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">🪙 توزيع العملات</h3>
              <div className="space-y-3">
                {users.filter(u => u.role === 'student').slice(0, 10).map((student) => (
                  <div key={student.id} className="flex items-center justify-between">
                    <span className="text-gray-300 truncate max-w-[150px]">{student.name || student.email}</span>
                    <div className="flex-1 mx-4 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${((student.coins || 0) / stats.totalCoins) * 100}%` }}></div>
                    </div>
                    <span className="text-yellow-400 font-bold">{student.coins || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
