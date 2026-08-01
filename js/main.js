// أضف هذا الكود في نهاية main.js

// ============================================================
// DEBUG - أدوات التحقق
// ============================================================

function showLessonDebug() {
    const main = document.getElementById('mainContent');
    if (!main) return;
    
    if (!window.currentUser) {
        showLoginOverlay();
        return;
    }
    
    // تحليل الربط
    const analysis = validateLessonBinding();
    
    // عرض الكورسات مع عدد الحصص
    let coursesHtml = window.allCourses.map(c => {
        const lessons = window.allLessons.filter(l => {
            const lCourseId = l.courseId || l.course_id || l.parentCourse || l.parent_course || l.course || '';
            return lCourseId === c.id;
        });
        return `
            <div style="display:flex;justify-content:space-between;padding:8px 12px;border-bottom:1px solid var(--border);">
                <span>${escapeHtml(c.title)}</span>
                <span style="color:${lessons.length > 0 ? 'var(--success)' : 'var(--danger)'};">${lessons.length} حصة</span>
            </div>
        `;
    }).join('');
    
    // عرض الحصص غير المرتبطة
    let orphanLessonsHtml = window.allLessons
        .filter(l => !l.courseId)
        .map(l => `
            <div style="display:flex;justify-content:space-between;padding:8px 12px;border-bottom:1px solid var(--border);border-right:3px solid var(--danger);">
                <span>${escapeHtml(l.title)}</span>
                <span style="color:var(--danger);">⚠️ بدون courseId</span>
            </div>
        `).join('');
    
    // عرض الحصص المرتبطة بكورسات غير موجودة
    const courseIds = new Set(window.allCourses.map(c => c.id));
    let invalidLessonsHtml = window.allLessons
        .filter(l => l.courseId && !courseIds.has(l.courseId))
        .map(l => `
            <div style="display:flex;justify-content:space-between;padding:8px 12px;border-bottom:1px solid var(--border);border-right:3px solid var(--warning);">
                <span>${escapeHtml(l.title)}</span>
                <span style="color:var(--warning);">⚠️ courseId: ${escapeHtml(l.courseId)} (غير موجود)</span>
            </div>
        `).join('');
    
    main.innerHTML = `
        <div style="max-width:900px;margin:0 auto;padding:20px;">
            <button class="btn-outline btn-sm no-print" onclick="APP.showDashboard()">
                <i class="fas fa-arrow-right"></i> العودة
            </button>
            
            <h1 style="font-family:'Lalezar',cursive;font-size:clamp(1.5rem,2.5vw,2.5rem);color:var(--text);margin:12px 0 4px;">
                🔍 أدوات التحقق من ربط الحصص
            </h1>
            
            <!-- الإحصائيات -->
            <div class="card" style="padding:20px;margin-bottom:16px;">
                <h3 style="font-weight:700;margin-bottom:12px;">📊 إحصائيات الربط</h3>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;">
                    <div style="text-align:center;padding:12px;background:var(--bg);border-radius:var(--radius);">
                        <div style="font-size:0.7rem;color:var(--text2);">إجمالي الحصص</div>
                        <div style="font-size:1.5rem;font-weight:700;color:var(--primary);">${analysis.totalLessons}</div>
                    </div>
                    <div style="text-align:center;padding:12px;background:var(--bg);border-radius:var(--radius);">
                        <div style="font-size:0.7rem;color:var(--text2);">مرتبطة بشكل صحيح</div>
                        <div style="font-size:1.5rem;font-weight:700;color:var(--success);">${analysis.validLessons}</div>
                    </div>
                    <div style="text-align:center;padding:12px;background:var(--bg);border-radius:var(--radius);">
                        <div style="font-size:0.7rem;color:var(--text2);">بدون courseId</div>
                        <div style="font-size:1.5rem;font-weight:700;color:var(--danger);">${analysis.orphanLessons}</div>
                    </div>
                    <div style="text-align:center;padding:12px;background:var(--bg);border-radius:var(--radius);">
                        <div style="font-size:0.7rem;color:var(--text2);">مع courseId غير صحيح</div>
                        <div style="font-size:1.5rem;font-weight:700;color:var(--warning);">${analysis.invalidLessons}</div>
                    </div>
                </div>
            </div>
            
            <!-- الكورسات -->
            <div class="card" style="padding:16px;margin-bottom:12px;">
                <h3 style="font-weight:700;margin-bottom:8px;">📚 الكورسات وعدد الحصص</h3>
                ${coursesHtml || '<p style="color:var(--text2);">لا توجد كورسات</p>'}
            </div>
            
            <!-- الحصص بدون courseId -->
            ${orphanLessonsHtml ? `
                <div class="card" style="padding:16px;margin-bottom:12px;border:2px solid var(--danger);">
                    <h3 style="font-weight:700;margin-bottom:8px;color:var(--danger);">⚠️ حصص بدون courseId (${analysis.orphanLessons})</h3>
                    ${orphanLessonsHtml}
                </div>
            ` : ''}
            
            <!-- الحصص مع courseId غير صحيح -->
            ${invalidLessonsHtml ? `
                <div class="card" style="padding:16px;margin-bottom:12px;border:2px solid var(--warning);">
                    <h3 style="font-weight:700;margin-bottom:8px;color:var(--warning);">⚠️ حصص مع courseId غير صحيح (${analysis.invalidLessons})</h3>
                    ${invalidLessonsHtml}
                </div>
            ` : ''}
            
            <!-- زر الإصلاح التلقائي -->
            <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:12px;">
                <button class="btn-primary" onclick="APP.autoFixLessonBinding()">
                    🔧 إصلاح تلقائي
                </button>
                <button class="btn-outline" onclick="APP.validateLessonBinding()">
                    🔄 إعادة التحقق
                </button>
                <button class="btn-outline" onclick="APP.loadLessons();APP.loadCourses();">
                    📥 إعادة تحميل البيانات
                </button>
            </div>
            
            <div style="margin-top:12px;padding:12px;background:var(--bg);border-radius:var(--radius);font-size:0.85rem;color:var(--text2);">
                💡 <strong>تلميح:</strong> إذا كانت الحصص غير مرتبطة، استخدم زر "إصلاح تلقائي" أو قم بتحديث كل حصة يدوياً من Firebase.
            </div>
        </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// الإصلاح التلقائي - محاولة ربط الحصص بالكورسات
// ============================================================
async function autoFixLessonBinding() {
    if (!window.currentUser) {
        showToast('⚠️ يجب تسجيل الدخول أولاً', 'error');
        return;
    }
    
    if (!confirm('⚠️ هل أنت متأكد من إجراء الإصلاح التلقائي؟ سيتم محاولة ربط الحصص بناءً على التشابه في الأسماء.')) {
        return;
    }
    
    showToast('⏳ جاري إصلاح الربط...', 'info');
    
    try {
        let fixed = 0;
        const courseIds = new Set(window.allCourses.map(c => c.id));
        
        // الحصص بدون courseId
        const orphanLessons = window.allLessons.filter(l => !l.courseId);
        
        for (const lesson of orphanLessons) {
            // محاولة العثور على الكورس المناسب بناءً على العنوان
            let bestMatch = null;
            let bestScore = 0;
            
            for (const course of window.allCourses) {
                let score = 0;
                const lessonTitle = lesson.title || '';
                const courseTitle = course.title || '';
                const courseId = course.id || '';
                
                // مطابقة جزء من العنوان
                if (lessonTitle.includes(courseTitle) || courseTitle.includes(lessonTitle)) {
                    score += 3;
                }
                
                // مطابقة الكلمات المفتاحية
                const lessonWords = lessonTitle.split(' ');
                const courseWords = courseTitle.split(' ');
                for (const w of lessonWords) {
                    if (courseWords.includes(w) && w.length > 2) {
                        score += 1;
                    }
                }
                
                // مطابقة الصف الدراسي
                if (lesson.grade && course.grade && lesson.grade === course.grade) {
                    score += 2;
                }
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = course;
                }
            }
            
            if (bestMatch && bestScore > 2) {
                await window.database.ref('lessons/' + lesson.id + '/courseId').set(bestMatch.id);
                fixed++;
                console.log(`✅ تم ربط الحصة "${lesson.title}" بالكورس "${bestMatch.title}"`);
            }
        }
        
        // إعادة تحميل البيانات
        await loadLessons();
        await loadCourses();
        
        showToast(`✅ تم إصلاح ${fixed} حصة بنجاح!`, 'success');
        
        if (fixed === 0) {
            showToast('⚠️ لم يتم العثور على حصص للإصلاح', 'warning');
        }
        
    } catch (err) {
        console.error('❌ Error auto-fixing:', err);
        showToast('❌ حدث خطأ في الإصلاح التلقائي', 'error');
    }
}

// ============================================================
// إضافة وظيفة للتحقق من هيكل Firebase
// ============================================================
async function checkFirebaseStructure() {
    showToast('⏳ جاري التحقق من هيكل Firebase...', 'info');
    
    try {
        // التحقق من مسار lessons
        const lessonsSnap = await window.database.ref('lessons').once('value');
        const lessonsExist = lessonsSnap.exists();
        const lessonsCount = lessonsExist ? lessonsSnap.numChildren() : 0;
        
        // التحقق من مسار courses/{id}/lessons
        let nestedLessonsCount = 0;
        let nestedLessonsExist = false;
        if (window.allCourses && window.allCourses.length > 0) {
            for (const course of window.allCourses) {
                const nestedSnap = await window.database.ref('courses/' + course.id + '/lessons').once('value');
                if (nestedSnap.exists()) {
                    nestedLessonsExist = true;
                    nestedLessonsCount += nestedSnap.numChildren();
                }
            }
        }
        
        console.log('🔍 === هيكل Firebase ===');
        console.log('📚 مسار lessons:', lessonsExist ? lessonsCount + ' حصة' : 'غير موجود');
        console.log('📚 مسار courses/{id}/lessons:', nestedLessonsExist ? nestedLessonsCount + ' حصة' : 'غير موجود');
        
        let message = '';
        if (lessonsExist && nestedLessonsExist) {
            message = '⚠️ يوجد حصص في كلا المسارين! قد يكون هناك تضارب.';
        } else if (lessonsExist) {
            message = '✅ الحصص موجودة في مسار "lessons" (الصيغة القديمة)';
        } else if (nestedLessonsExist) {
            message = '✅ الحصص موجودة في مسار "courses/{id}/lessons" (الصيغة الجديدة)';
        } else {
            message = '❌ لا توجد حصص في أي من المسارين!';
        }
        
        showToast('🔍 ' + message, 'info');
        
        // عرض النتيجة في الكونسول
        console.log('🔍 ' + message);
        
    } catch (err) {
        console.error('❌ Error checking structure:', err);
        showToast('❌ حدث خطأ في التحقق', 'error');
    }
}

// ============================================================
// EXPOSE DEBUG FUNCTIONS
// ============================================================
window.showLessonDebug = showLessonDebug;
window.autoFixLessonBinding = autoFixLessonBinding;
window.checkFirebaseStructure = checkFirebaseStructure;
window.validateLessonBinding = validateLessonBinding;
window.fixLessonBinding = fixLessonBinding;
