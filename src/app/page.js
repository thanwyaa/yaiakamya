'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db, getAllUsers, toggleBlockUser, updateUserCoins, addLecture, deleteLecture, addQuiz, deleteQuiz } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [showAddLecture, setShowAddLecture] = useState(false);
  const [showAddQuiz, setShowAddQuiz] = useState(false);
  
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

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }
    fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersData = await getAllUsers();
      const lecturesSnap = await getDocs(collection(db, 'lectures'));
      const quizzesSnap = await getDocs(collection(db, 'quizzes'));
      
      setUsers(usersData);
      setLectures(lecturesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setQuizzes(quizzesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
      fetchData();
    } catch (error) {
      toast.error('حدث خطأ في إضافة المحاضرة');
    }
  };

  const handleDeleteLecture = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذه المحاضرة؟')) {
      try {
        await deleteLecture(id);
        toast.success('تم حذف المحاضرة');
        fetchData();
      } catch (error) {
        toast.error('حدث خطأ في الحذف');
      }
    }
  };

  const handleToggleBlock = async (userId, currentStatus) => {
    try {
      await toggleBlockUser(userId, !currentStatus);
      toast.success(currentStatus ? 'تم فك الحظر' : 'تم حظر المستخدم');
      fetchData();
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const handleUpdateCoins = async (userId, newCoins) => {
    try {
      await updateUserCoins(userId, parseInt(newCoins));
      toast.success('تم تحديث العملات');
      fetchData();
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  // Chart data
  const userGrowthData = users.slice(0, 10).map((u, i) => ({
    name: `أسبوع ${i + 1}`,
    users: Math.floor(Math.random() * 100) + 50
  }));

  const chapterDistribution = lectures.reduce((acc, lecture) => {
    const chapter = lecture.chapter || 'أخرى';
    acc[chapter] = (acc[chapter] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(chapterDistribution).map(([name, value]) => ({ name, value }));
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4"></div>
          <p className="text-white">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
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
                  ? 'bg-
