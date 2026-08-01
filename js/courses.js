// ============================================================
// COURSES MODULE - إصلاح ربط الحصص بالكورسات
// ============================================================

function loadLessons() {
    // التحقق من الكاش أولاً
    if (dataLoaded && window.cache.lessons && window.cache.lessons.length > 0) {
        window.allLessons = window.cache.lessons;
        console.log('📚 تم تحميل الحصص من الكاش:', window.allLessons.length);
        return;
    }
    
    if (dataLoading) return;
    dataLoading = true;

    // محاولة قراءة الحصص من المسار الجديد أولاً
    window.database.ref('lessons').orderByChild('order').once('value', (snapshot) => {
        try {
            window.allLessons = [];
            snapshot.forEach((child) => {
                const data = child.val();
                // توحيد أسماء الحقول - دعم جميع الصيغ
                const lesson = { 
                    id: child.key, 
                    ...data,
                    // توحيد courseId بغض النظر عن اسم الحقل
                    courseId: data.courseId || data.course_id || data.parentCourse || data.parent_course || data.course || ''
                };
                window.allLessons.push(lesson);
            });
            
            console.log('📚 تم تحميل الحصص:', window.allLessons.length);
            console.log('📚 عينة من الحصص:', window.allLessons.slice(0, 3));
            
            window.cache.lessons = window.allLessons;
            updateCache();
            dataLoading = false;
            
            // إعادة عرض الكورسات بعد تحميل الحصص
            renderCourses(window.allCourses);
            
        } catch (err) {
            console.error('❌ Error loading lessons:', err);
            dataLoading = false;
        }
    }).catch((err) => {
        console.error('❌ Firebase error loading lessons:', err);
        dataLoading = false;
    });
}

// ============================================================
// دالة مساعدة للتحقق من صحة ربط الحصص
// ============================================================
function validateLessonBinding() {
    console.log('🔍 === تحليل ربط الحصص بالكورسات ===');
    
    // عرض جميع الكورسات
    console.log('📚 الكورسات المتاحة:', window.allCourses.map(c => ({
        id: c.id,
        title: c.title,
        lessonsCount: c.lessonsCount
    })));
    
    // عرض جميع الحصص مع courseId
    console.log('📚 الحصص المحملة:', window.allLessons.map(l => ({
        id: l.id,
        title: l.title,
        courseId: l.courseId,
        courseIdType: typeof l.courseId
    })));
    
    // التحقق من الحصص غير المرتبطة
    const orphanLessons = window.allLessons.filter(l => !l.courseId);
    if (orphanLessons.length > 0) {
        console.warn('⚠️ حصص بدون courseId:', orphanLessons);
    }
    
    // التحقق من الحصص المرتبطة بكورسات غير موجودة
    const courseIds = new Set(window.allCourses.map(c => c.id));
    const invalidLessons = window.allLessons.filter(l => l.courseId && !courseIds.has(l.courseId));
    if (invalidLessons.length > 0) {
        console.warn('⚠️ حصص مرتبطة بكورسات غير موجودة:', invalidLessons);
    }
    
    // عرض الحصص المرتبطة بشكل صحيح
    const validLessons = window.allLessons.filter(l => l.courseId && courseIds.has(l.courseId));
    console.log('✅ حصص مرتبطة بشكل صحيح:', validLessons.length);
    
    return {
        totalLessons: window.allLessons.length,
        orphanLessons: orphanLessons.length,
        invalidLessons: invalidLessons.length,
        validLessons: validLessons.length
    };
}

// ============================================================
// دالة مساعدة لربط الحصص بالكورسات يدوياً
// ============================================================
async function fixLessonBinding(lessonId, correctCourseId) {
    if (!window.currentUser) {
        showToast('⚠️ يجب تسجيل الدخول أولاً', 'error');
        return;
    }
    
    try {
        await window.database.ref('lessons/' + lessonId + '/courseId').set(correctCourseId);
        showToast('✅ تم تحديث ربط الحصة بنجاح', 'success');
        
        // إعادة تحميل الحصص
        loadLessons();
    } catch (err) {
        console.error('❌ Error fixing lesson binding:', err);
        showToast('❌ حدث خطأ في تحديث الربط', 'error');
    }
}

// ============================================================
// تحسين دالة renderCourses لعرض حالة الربط
// ============================================================
function renderCourses(courses) {
    const grid = document.getElementById('coursesGrid');
    if (!grid) return;

    if (!courses || courses.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1;">
                <div class="icon">📚</div>
                <h3>لا توجد كورسات متاحة حالياً</h3>
                <p>سيتم إضافة الكورسات قريباً</p>
                <button class="btn-primary btn-sm" style="margin-top:12px;" onclick="APP.validateLessonBinding()">
                    🔍 التحقق من الربط
                </button>
            </div>
        `;
        return;
    }

    grid.innerHTML = courses.map(c => {
        // فلترة الحصص باستخدام courseId موحد
        const lessons = window.allLessons.filter(l => {
            const lCourseId = l.courseId || l.course_id || l.parentCourse || l.parent_course || l.course || '';
            return lCourseId === c.id;
        });
        
        const completed = lessons.filter(l => window.userCourseProgress[l.id]?.watched);
        const isCompleted = lessons.length > 0 && completed.length === lessons.length;
        
        // عرض حالة الربط في الكونسول
        console.log(`📚 كورس: ${c.title} (${c.id}) - عدد الحصص: ${lessons.length}`);

        const subscribed = window.currentUser ? isUserSubscribed(c.id) : false;
        const hasPremium = window.currentUser ? hasPremiumAccess(c.id) : false;
        const isLocked = !window.currentUser || (!subscribed && !hasPremium && c.isFree === false);
        const isFree = c.isFree !== false;
        const priceDisplay = isFree ? 'مجاني' : (c.price || 'مدفوع');

        return `
            <div class="card ${isCompleted ? 'card-completed' : ''}" style="cursor:pointer;position:relative;" 
                 onclick="${isCompleted ? `APP.showCompletedModal()` : `APP.openCoursePage('${c.id}')`}">
                <div style="position:relative;overflow:hidden;">
                    <img src="${c.image || 'https://placehold.co/600x400/1a1f2e/0B4F8C?text=كورس'}" 
                         alt="${escapeHtml(c.title) || 'كورس'}" 
                         class="card-img" 
                         loading="lazy"
                         onerror="this.src='https://placehold.co/600x400/1a1f2e/0B4F8C?text=كورس'">
                    <div style="position:absolute;top:12px;right:12px;display:flex;gap:6px;z-index:2;flex-wrap:wrap;">
                        <span style="font-size:0.8rem;padding:4px 16px;border-radius:50px;background:${isFree ? 'var(--success)' : 'var(--gold)'};color:${isFree ? '#fff' : '#081B2C'};font-weight:700;">
                            ${isFree ? '🆓 مجاني' : '💰 مدفوع'}
                        </span>
                        ${!isFree ? `<span style="font-size:0.8rem;padding:4px 16px;border-radius:50px;background:var(--gold);color:#081B2C;font-weight:700;">${escapeHtml(priceDisplay)}</span>` : ''}
                        ${isLocked ? '<span style="font-size:0.8rem;padding:4px 16px;border-radius:50px;background:rgba(0,0,0,0.7);color:#fff;font-weight:700;">🔒</span>' : ''}
                        ${isCompleted ? '<span style="font-size:0.8rem;padding:4px 16px;border-radius:50px;background:var(--success);color:#fff;font-weight:700;">✅ مكتمل</span>' : ''}
                        ${lessons.length === 0 ? '<span style="font-size:0.8rem;padding:4px 16px;border-radius:50px;background:var(--warning);color:#081B2C;font-weight:700;">⚠️ لا توجد حصص</span>' : ''}
                    </div>
                    ${isLocked ? `<div class="lock-overlay"><span class="lock-text">🔒 هذا الكورس مدفوع</span></div>` : ''}
                    ${isCompleted ? `<div class="completed-overlay"><div class="check">✅</div><div class="label">مكتمل</div></div>` : ''}
                </div>
                <div class="card-body">
                    <h3 style="font-weight:800;font-size:1.2rem;color:var(--text);margin-bottom:4px;">${escapeHtml(c.title) || 'كورس'}</h3>
                    <p style="font-size:0.85rem;color:var(--text2);margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(c.description) || ''}</p>
                    <div style="display:flex;flex-wrap:wrap;gap:4px 10px;font-size:0.7rem;color:var(--text2);margin-bottom:8px;border-top:1px solid var(--border);padding-top:6px;">
                        <span>🎯 ${c.grade || 'كل الصفوف'}</span>
                        <span>📚 ${lessons.length} حصة</span>
                        ${!isFree ? `<span style="font-weight:700;color:var(--gold-dark);">💰 ${escapeHtml(priceDisplay)}</span>` : ''}
                    </div>
                    ${window.currentUser ? `
                        ${subscribed || hasPremium ? `
                            <button class="btn-primary" style="width:100%;justify-content:center;font-size:0.8rem;padding:6px 12px;background:${isCompleted ? 'var(--success)' : 'var(--primary2)'};" onclick="event.stopPropagation(); ${isCompleted ? `APP.showCompletedModal()` : `APP.openCoursePage('${c.id}')`}">
                                ${isCompleted ? '✅ مكتمل' : '📖 متابعة'}
                            </button>
                        ` : `
                            <button class="btn-primary" style="width:100%;justify-content:center;font-size:0.8rem;padding:6px 12px;" onclick="event.stopPropagation(); APP.openCoursePage('${c.id}')">
                                ${isFree ? '📝 اشترك الآن' : '💰 اشترِ الآن'}
                            </button>
                        `}
                    ` : `
                        <button class="btn-primary" style="width:100%;justify-content:center;font-size:0.8rem;padding:6px 12px;" onclick="event.stopPropagation(); APP.showLoginOverlay()">
                            🔒 اشترك الآن
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

// ============================================================
// EXPOSE DEBUG FUNCTIONS
// ============================================================
window.validateLessonBinding = validateLessonBinding;
window.fixLessonBinding = fixLessonBinding;
