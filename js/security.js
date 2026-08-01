// ============================================================
// FIX FUNCTIONS - إصلاح بيانات Firebase
// ============================================================

// دالة لإصلاح courseId لجميع الحصص في الكورس
async function fixAllLessonsInCourse(courseId, oldCourseId) {
    if (!window.currentUser) {
        showToast('⚠️ يجب تسجيل الدخول أولاً', 'error');
        return;
    }
    
    try {
        const snapshot = await window.database.ref('lessons').orderByChild('courseId').equalTo(oldCourseId).once('value');
        const updates = {};
        let count = 0;
        
        snapshot.forEach((child) => {
            updates[child.key + '/courseId'] = courseId;
            count++;
        });
        
        if (count === 0) {
            showToast('⚠️ لا توجد حصص بهذا الـ courseId', 'warning');
            return;
        }
        
        await window.database.ref('lessons').update(updates);
        showToast(`✅ تم تحديث ${count} حصة بنجاح`, 'success');
        
        // إعادة تحميل البيانات
        loadLessons();
        loadCourses();
        
    } catch (err) {
        console.error('❌ Error fixing lessons:', err);
        showToast('❌ حدث خطأ في التحديث', 'error');
    }
}

// دالة لإضافة courseId لحصة فردية
async function addCourseIdToLesson(lessonId, courseId) {
    if (!window.currentUser) {
        showToast('⚠️ يجب تسجيل الدخول أولاً', 'error');
        return;
    }
    
    try {
        await window.database.ref('lessons/' + lessonId + '/courseId').set(courseId);
        showToast('✅ تم تحديث الحصة بنجاح', 'success');
        loadLessons();
    } catch (err) {
        console.error('❌ Error adding courseId:', err);
        showToast('❌ حدث خطأ في التحديث', 'error');
    }
}

// ============================================================
// EXPOSE FIX FUNCTIONS
// ============================================================
window.fixAllLessonsInCourse = fixAllLessonsInCourse;
window.addCourseIdToLesson = addCourseIdToLesson;
