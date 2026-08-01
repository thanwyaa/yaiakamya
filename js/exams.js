// ============================================================
// EXAMS MODULE - Exams, Quizzes, Results, Error Bank
// ============================================================

window.allExams = [];
window.allQuizzes = [];
window.examTimer = null;
window.examStartTime = null;
window.isExamActive = false;
window.examSubmitted = false;
window.examAnswers = {};
window.quizAnswers = {};
window.currentExamId = null;
window.currentExamData = null;
window.currentQuizData = null;
window.pendingExamCallback = null;
window.isExamMode = false;

function showErrorBank() {
    if (!window.currentUser) {
        showLoginOverlay();
        return;
    }

    const main = document.getElementById('mainContent');
    if (!main) return;

    window.database.ref('users/' + window.currentUser.uid + '/errorBank').once('value', (snapshot) => {
        let errors = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            if (Array.isArray(data)) {
                errors = data.filter(e => !e.solved);
            }
        }

        const totalErrors = errors.length;

        main.innerHTML = `
            <div style="max-width:800px;margin:0 auto;padding:20px;">
                <button class="btn-outline btn-sm no-print" onclick="APP.showDashboard()">
                    <i class="fas fa-arrow-right"></i> العودة
                </button>
                
                <h1 style="font-family:'Lalezar',cursive;font-size:clamp(1.5rem,2.5vw,2.5rem);color:var(--text);margin:12px 0 4px;">
                    ❌ بنك الأخطاء
                </h1>
                
                <div class="error-bank-summary">
                    <div class="label">عدد الأسئلة التي أخطأت فيها</div>
                    <div class="count">${totalErrors}</div>
                    <div class="label">سؤال</div>
                    ${totalErrors > 0 ? `
                        <div style="margin-top:16px;">
                            <p style="font-size:0.9rem;color:var(--text2);">كم سؤال تريد مراجعته؟</p>
                            <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:8px;">
                                <button class="btn-primary btn-sm" onclick="APP.startErrorReview(5)">5 أسئلة</button>
                                <button class="btn-primary btn-sm" onclick="APP.startErrorReview(10)">10 أسئلة</button>
                                <button class="btn-primary btn-sm" onclick="APP.startErrorReview(20)">20 سؤال</button>
                                <button class="btn-primary btn-sm" onclick="APP.startErrorReview(50)">50 سؤال</button>
                                <button class="btn-primary btn-sm" style="background:var(--gold);color:#081B2C;" onclick="APP.startErrorReview('all')">الكل (${totalErrors})</button>
                            </div>
                        </div>
                    ` : `
                        <div style="margin-top:12px;font-size:1.2rem;color:var(--success);">🎉 ممتاز! لا توجد أخطاء</div>
                    `}
                </div>
                
                ${totalErrors === 0 ? `
                    <div class="empty-state">
                        <div class="icon">🎉</div>
                        <h3>ممتاز! لا توجد أخطاء</h3>
                        <p>كل إجاباتك صحيحة، استمر بهذا الأداء الرائع!</p>
                    </div>
                ` : errors.map((e, idx) => `
                    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:12px;margin-bottom:8px;border-right:4px solid var(--danger);">
                        <div style="font-weight:600;font-size:0.9rem;color:var(--text);">${idx + 1}. ${escapeHtml(e.question)}</div>
                        <div style="font-size:0.8rem;color:var(--text2);margin-top:4px;">
                            <span style="color:var(--success);">✅ ${escapeHtml(e.correctAnswer)}</span>
                            <span style="color:var(--danger);margin-right:12px;">❌ ${escapeHtml(e.userAnswer)}</span>
                            <span style="font-size:0.7rem;color:var(--text2);">(محاولة ${e.attempts || 1})</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function startErrorReview(count) {
    if (!window.currentUser) return;
    
    window.database.ref('users/' + window.currentUser.uid + '/errorBank').once('value', (snapshot) => {
        let errors = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            if (Array.isArray(data)) {
                errors = data.filter(e => !e.solved);
            }
        }
        
        if (errors.length === 0) {
            showToast('🎉 لا توجد أخطاء للمراجعة!', 'success');
            return;
        }

        let selectedErrors = errors;
        if (count !== 'all' && typeof count === 'number') {
            selectedErrors = errors.slice(0, Math.min(count, errors.length));
        }

        if (selectedErrors.length === 0) {
            showToast('⚠️ لا توجد أخطاء كافية للمراجعة', 'warning');
            return;
        }

        const examQuestions = selectedErrors.map(e => {
            const options = generateOptions(e.correctAnswer, e.userAnswer);
            return {
                question: e.question,
                options: options,
                correctAnswer: options.indexOf(e.correctAnswer),
                explanation: `إجابتك السابقة: ${e.userAnswer} | الإجابة الصحيحة: ${e.correctAnswer}`
            };
        });

        const exam = {
            id: 'error_review_' + Date.now(),
            title: `📝 مراجعة الأخطاء (${selectedErrors.length} سؤال)`,
            description: 'أسئلة من بنك الأخطاء الخاص بك - أجب بشكل صحيح لحذفها من القائمة',
            questions: examQuestions,
            atomsReward: 0,
            duration: Math.ceil(selectedErrors.length * 1.5)
        };
        
        const errorData = selectedErrors.map((e, idx) => ({
            index: idx,
            question: e.question,
            correctAnswer: e.correctAnswer,
            userAnswer: e.userAnswer
        }));
        sessionStorage.setItem('error_review_data', JSON.stringify(errorData));
        
        const originalSubmit = submitExam;
        submitExam = async function(id, maxAtoms, autoSubmit) {
            await originalSubmit.call(this, id, maxAtoms, autoSubmit);
            
            if (id && id.startsWith('error_review_')) {
                const storedData = sessionStorage.getItem('error_review_data');
                if (storedData) {
                    const data = JSON.parse(storedData);
                    const answers = window.examAnswers[id] || {};
                    const questions = exam.questions || [];
                    
                    let correctIndices = [];
                    for (let i = 0; i < Math.min(Object.keys(answers).length, questions.length); i++) {
                        if (answers[i] && answers[i].selected === questions[i].correctAnswer) {
                            correctIndices.push(i);
                        }
                    }
                    
                    if (correctIndices.length > 0) {
                        const errorRef = window.database.ref('users/' + window.currentUser.uid + '/errorBank');
                        const errorSnap = await errorRef.once('value');
                        if (errorSnap.exists()) {
                            let currentErrors = errorSnap.val() || [];
                            if (Array.isArray(currentErrors)) {
                                correctIndices.forEach(idx => {
                                    if (data[idx]) {
                                        const q = data[idx].question;
                                        const errIdx = currentErrors.findIndex(e => e.question === q && !e.solved);
                                        if (errIdx !== -1) {
                                            currentErrors[errIdx].solved = true;
                                            currentErrors[errIdx].solvedAt = new Date().toISOString();
                                        }
                                    }
                                });
                                await errorRef.set(currentErrors);
                                if (correctIndices.length > 0) {
                                    showToast(`✅ تم حذف ${correctIndices.length} سؤال من بنك الأخطاء!`, 'success');
                                    if (typeof addNotification === 'function') {
                                        await addNotification(window.currentUser.uid, '✅ تم تصحيح أخطاء!', `لقد أجبت بشكل صحيح على ${correctIndices.length} سؤال وتم حذفهم من بنك الأخطاء.`, '✅');
                                    }
                                }
                            }
                        }
                        sessionStorage.removeItem('error_review_data');
                    }
                }
            }
        };
        
        window.currentExamData = exam;
        const startTime = Date.now();
        renderExamUI(exam, startTime, exam.duration || 0);
    });
}

function generateOptions(correctAnswer, wrongAnswer) {
    const options = [correctAnswer];
    if (wrongAnswer && wrongAnswer !== correctAnswer) {
        options.push(wrongAnswer);
    }
    const fakeOptions = [
        'تفاعل كيميائي',
        'مركب عضوي',
        'عنصر فلزي',
        'محلول قاعدي',
        'غاز خامل',
        'أيون موجب',
        'رابطة تساهمية',
        'تفاعل عكسي'
    ];
    const shuffledFakes = fakeOptions.sort(() => 0.5 - Math.random());
    let count = 0;
    while (options.length < 4 && count < shuffledFakes.length) {
        if (!options.includes(shuffledFakes[count]) && shuffledFakes[count] !== correctAnswer && shuffledFakes[count] !== wrongAnswer) {
            options.push(shuffledFakes[count]);
        }
        count++;
    }
    return options.sort(() => 0.5 - Math.random());
}

function showResults() {
    if (!window.currentUser) {
        showLoginOverlay();
        return;
    }

    const main = document.getElementById('mainContent');
    if (!main) return;

    window.database.ref('users/' + window.currentUser.uid + '/results').orderByChild('completedAt').limitToLast(50).once('value', (snapshot) => {
        const results = [];
        snapshot.forEach((child) => {
            const data = child.val();
            results.push({ id: child.key, ...data });
        });
        results.reverse();

        if (results.length === 0) {
            main.innerHTML = `
                <div class="results-page">
                    <div class="header">
                        <h1>📊 نتائجي</h1>
                        <button class="btn-outline btn-sm" onclick="APP.showDashboard()">
                            <i class="fas fa-arrow-right"></i> العودة
                        </button>
                    </div>
                    <div class="empty-state">
                        <div class="icon">📊</div>
                        <h3>لا توجد نتائج بعد</h3>
                        <p>ابدأ بحل الكويزات والامتحانات لتظهر نتائجك هنا</p>
                        <button class="btn-primary" style="margin-top:12px;" onclick="APP.scrollToCourses()">📚 ابدأ التعلم</button>
                    </div>
                </div>
            `;
            return;
        }

        let html = `
            <div class="results-page">
                <div class="header">
                    <h1>📊 نتائجي</h1>
                    <button class="btn-outline btn-sm" onclick="APP.showDashboard()">
                        <i class="fas fa-arrow-right"></i> العودة
                    </button>
                </div>
                <p style="color:var(--text2);margin-bottom:12px;">عدد النتائج: ${results.length}</p>
                <div style="overflow-x:auto;">
                    <table class="results-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>الاختبار</th>
                                <th>النوع</th>
                                <th>الدرجة</th>
                                <th>النسبة</th>
                                <th>صحيح/خطأ</th>
                                <th>الوقت</th>
                                <th>التاريخ</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${results.map((r, idx) => `
                                <tr>
                                    <td>${idx + 1}</td>
                                    <td style="font-weight:600;">${escapeHtml(r.title || 'اختبار')}</td>
                                    <td><span class="badge-type ${r.type || 'exam'}">${r.type || 'exam'}</span></td>
                                    <td>${r.score || 0}%</td>
                                    <td><span class="${(r.score || 0) >= 50 ? 'badge-pass' : 'badge-fail'}">${(r.score || 0) >= 50 ? '✅ نجاح' : '❌ رسوب'}</span></td>
                                    <td>${r.correctAnswers || 0}/${r.totalQuestions || 0}</td>
                                    <td>${Math.floor((r.timeSpent || 0) / 60)} د</td>
                                    <td>${formatTime(r.completedAt)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        main.innerHTML = html;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function showCertificate() {
    if (!window.currentUser) {
        showLoginOverlay();
        return;
    }

    const main = document.getElementById('mainContent');
    if (!main) return;

    const name = window.userData?.name || 'طالب';
    const code = window.userData?.code || '---';
    const grade = window.userData?.grade || 'لم يحدد';
    const studyType = window.userData?.studyType || 'عام';
    const atoms = window.userData?.atoms || 0;
    const progress = window.userData?.progress || 0;

    let completedCourse = null;
    for (const c of window.allCourses) {
        const lessons = window.allLessons.filter(l => {
            const lCourseId = l.courseId || l.course_id || l.parentCourse || l.parent_course || l.course || '';
            return lCourseId === c.id;
        });
        const completed = lessons.filter(l => window.userCourseProgress[l.id]?.watched);
        if (lessons.length > 0 && completed.length === lessons.length) {
            completedCourse = c;
            break;
        }
    }

    if (!completedCourse) {
        showToast('⚠️ يجب إكمال كورس أولاً للحصول على شهادة', 'warning');
        return;
    }

    main.innerHTML = `
        <div style="max-width:800px;margin:0 auto;padding:20px;">
            <button class="btn-outline btn-sm no-print" onclick="APP.showDashboard()"><i class="fas fa-arrow-right"></i> العودة</button>
            <h1 style="font-family:'Lalezar',cursive;font-size:clamp(1.5rem,2.5vw,2.5rem);color:var(--text);margin:12px 0 4px;">📜 شهادة الإنجاز</h1>
            <p style="color:var(--text2);margin-bottom:16px;">شهادة تقدير لإنجازاتك في منصة يلا كيمياء</p>

            <div class="certificate-preview">
                <div class="logo">يلا كيمياء</div>
                <h2>شهادة إنجاز</h2>
                <div style="font-size:0.9rem;color:var(--text2);">نقدم هذه الشهادة إلى</div>
                <div class="name">${escapeHtml(name)}</div>
                <div style="font-size:0.9rem;color:var(--text2);">كود الطالب: ${escapeHtml(code)}</div>
                <div class="details">الصف: ${escapeHtml(grade)} • نوع الدراسة: ${escapeHtml(studyType)}</div>
                <div class="details">🏆 ${escapeHtml(completedCourse.title)}</div>
                <div class="details">⚛️ ${atoms} ذرة • 📈 ${progress}% إنجاز</div>
                <div class="details">📅 ${new Date().toLocaleDateString('ar')}</div>
                <div class="qr-code"><i class="fas fa-qrcode"></i></div>
                <div style="margin-top:12px;">
                    <button class="btn-primary no-print" onclick="APP.downloadCertificate()"><i class="fas fa-download"></i> تحميل PDF</button>
                </div>
            </div>
        </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function downloadCertificate() {
    showToast('📄 جاري إنشاء الشهادة...', 'info');
    window.print();
}

function showStudentCard() {
    if (!window.currentUser) {
        showLoginOverlay();
        return;
    }

    const main = document.getElementById('mainContent');
    if (!main) return;

    const name = window.userData?.name || 'طالب';
    const email = window.userData?.email || window.auth.currentUser?.email || '';
    const code = window.userData?.code || '---';
    const grade = window.userData?.grade || 'لم يحدد';
    const studyType = window.userData?.studyType || 'عام';
    const phone = window.userData?.phone || 'لم يحدد';
    const parentPhone = window.userData?.parentPhone || 'لم يحدد';
    const photoURL = window.userData?.photoURL || '';
    const createdAt = window.userData?.createdAt ? new Date(window.userData.createdAt).toLocaleDateString('ar') : 'غير معروف';

    const avatarHtml = photoURL ? 
        `<img src="${photoURL}" alt="${escapeHtml(name)}" loading="lazy">` : 
        (name || 'U')[0].toUpperCase();

    main.innerHTML = `
        <div style="max-width:500px;margin:0 auto;padding:20px;">
            <button class="btn-outline btn-sm no-print" onclick="APP.showDashboard()"><i class="fas fa-arrow-right"></i> العودة</button>
            <h1 style="font-family:'Lalezar',cursive;font-size:clamp(1.5rem,2.5vw,2.5rem);color:var(--text);margin:12px 0 4px;">🪪 بطاقة الطالب</h1>
            <p style="color:var(--text2);margin-bottom:16px;">بطاقة تعريفية تحوي بياناتك الشخصية</p>

            <div class="student-card-preview" id="studentCardPreview">
                <div class="watermark">YALLA CHEMISTRY</div>
                <div class="card-header">
                    <div class="logo">يلا كيمياء</div>
                    <div style="margin-right:auto;font-size:0.7rem;color:var(--text2);">بطاقة طالب</div>
                </div>
                <div class="card-avatar">${avatarHtml}</div>
                <div class="card-info">
                    <div class="name">${escapeHtml(name)}</div>
                    <div class="code">🔑 ${escapeHtml(code)}</div>
                    <div class="detail">📧 ${escapeHtml(email)}</div>
                    <div class="detail">📱 ${formatPhoneNumber(phone)}</div>
                    <div class="detail">👨‍👩‍👦 ${formatPhoneNumber(parentPhone)}</div>
                    <div class="detail">🎓 ${escapeHtml(grade)} • ${escapeHtml(studyType)}</div>
                    <div class="detail">📅 تاريخ الإنشاء: ${createdAt}</div>
                </div>
                <div class="card-footer">
                    يرجى عدم مشاركة هذه البطاقة أو بياناتها مع أي شخص حفاظًا على خصوصية حسابك.
                </div>
            </div>

            <div style="text-align:center;margin-top:16px;">
                <button class="btn-primary no-print" onclick="APP.downloadStudentCard()"><i class="fas fa-download"></i> تحميل البطاقة PDF</button>
            </div>
        </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function downloadStudentCard() {
    const element = document.getElementById('studentCardPreview');
    if (!element) return;
    showToast('📄 جاري إنشاء البطاقة...', 'info');
    html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('بطاقة_الطالب_' + (window.userData?.code || 'student') + '.pdf');
        showToast('✅ تم تحميل البطاقة بنجاح', 'success');
    }).catch(err => {
        console.error('Error generating card:', err);
        showToast('حدث خطأ في إنشاء البطاقة', 'error');
    });
}

function getAchievements() {
    const safeData = window.userData || {};
    const progressData = window.userCourseProgress || {};
    
    const atoms = safeData.atoms || 0;
    const streakDays = safeData.streak || 0;
    const perfectExams = safeData.perfectExams || 0;
    
    const completedLessons = Object.values(progressData).filter(p => p.watched).length;
    const examsCompleted = Object.values(progressData).filter(p => p.completed && p.type === 'exam').length;
    const quizzesCompleted = Object.values(progressData).filter(p => p.completed && p.type === 'quiz').length;
    
    let coursesCompleted = 0;
    window.allCourses.forEach(c => {
        const lessons = window.allLessons.filter(l => {
            const lCourseId = l.courseId || l.course_id || l.parentCourse || l.parent_course || l.course || '';
            return lCourseId === c.id;
        });
        const completed = lessons.filter(l => progressData[l.id]?.watched);
        if (lessons.length > 0 && completed.length === lessons.length) {
            coursesCompleted++;
        }
    });
    
    const achieved = {
        first_exam: examsCompleted > 0,
        first_100_atoms: atoms >= 100,
        first_500_atoms: atoms >= 500,
        first_1000_atoms: atoms >= 1000,
        complete_course: coursesCompleted > 0,
        complete_5_lessons: completedLessons >= 5,
        complete_20_lessons: completedLessons >= 20,
        study_7_days: streakDays >= 7,
        perfect_exam: perfectExams > 0,
        quiz_master: quizzesCompleted >= 10,
        exam_champion: examsCompleted >= 5,
        lesson_lover: completedLessons >= 50
    };

    return [
        { id: 'first_exam', icon: '📝', name: 'أول امتحان', desc: 'حل أول امتحان على المنصة', unlocked: achieved.first_exam },
        { id: 'first_100_atoms', icon: '🌟', name: '100 ذرة', desc: 'اجمع 100 ذرة', unlocked: achieved.first_100_atoms },
        { id: 'first_500_atoms', icon: '⭐', name: '500 ذرة', desc: 'اجمع 500 ذرة', unlocked: achieved.first_500_atoms },
        { id: 'first_1000_atoms', icon: '💎', name: '1000 ذرة', desc: 'اجمع 1000 ذرة', unlocked: achieved.first_1000_atoms },
        { id: 'complete_course', icon: '🎓', name: 'أول كورس', desc: 'أنهي أول كورس بالكامل', unlocked: achieved.complete_course },
        { id: 'complete_5_lessons', icon: '📚', name: '5 حصص', desc: 'أنهي 5 حصص', unlocked: achieved.complete_5_lessons },
        { id: 'complete_20_lessons', icon: '📚', name: '20 حصة', desc: 'أنهي 20 حصة', unlocked: achieved.complete_20_lessons },
        { id: 'study_7_days', icon: '🔥', name: '7 أيام دراسة', desc: 'ادرس 7 أيام متتالية', unlocked: achieved.study_7_days },
        { id: 'perfect_exam', icon: '💯', name: 'امتحان ممتاز', desc: 'احصل على 100% في امتحان', unlocked: achieved.perfect_exam },
        { id: 'quiz_master', icon: '🧪', name: 'سيد الكويزات', desc: 'حل 10 كويزات', unlocked: achieved.quiz_master },
        { id: 'exam_champion', icon: '🏆', name: 'بطل الامتحانات', desc: 'حل 5 امتحانات', unlocked: achieved.exam_champion },
        { id: 'lesson_lover', icon: '❤️', name: 'عاشق الحصص', desc: 'شاهد 50 حصة', unlocked: achieved.lesson_lover }
    ];
}

function showAchievements() {
    if (!window.currentUser) {
        showLoginOverlay();
        return;
    }

    const main = document.getElementById('mainContent');
    if (!main) return;

    const achievements = getAchievements();

    main.innerHTML = `
        <div style="max-width:800px;margin:0 auto;padding:20px;">
            <button class="btn-outline btn-sm no-print" onclick="APP.showDashboard()"><i class="fas fa-arrow-right"></i> العودة</button>
            <h1 style="font-family:'Lalezar',cursive;font-size:clamp(1.5rem,2.5vw,2.5rem);color:var(--text);margin:12px 0 4px;">🏅 إنجازاتي</h1>
            <p style="color:var(--text2);margin-bottom:16px;">الإنجازات التي حصلت عليها في رحلتك التعليمية</p>
            <div class="achievement-grid">
                ${achievements.map(a => `
                    <div class="achievement-item ${a.unlocked ? 'unlocked' : ''}">
                        <div class="icon">${a.icon}</div>
                        <div class="name">${a.name}</div>
                        <div class="desc">${a.desc}</div>
                        ${a.unlocked ? '<span style="font-size:0.7rem;color:var(--gold);">✅ تم الفتح</span>' : '<span style="font-size:0.7rem;color:var(--text-muted);">🔒 مغلق</span>'}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showAIInsights() {
    if (!window.currentUser) {
        showLoginOverlay();
        return;
    }

    const main = document.getElementById('mainContent');
    if (!main) return;

    const safeUserData = window.userData || {};
    const safeProgress = window.userCourseProgress || {};

    const atoms = safeUserData.atoms || 0;
    const progress = safeUserData.progress || 0;
    const completedLessons = Object.values(safeProgress).filter(p => p.watched).length;
    const totalLessons = window.allLessons.length;
    const examsCompleted = Object.values(safeProgress).filter(p => p.completed && p.type === 'exam').length;
    const quizzesCompleted = Object.values(safeProgress).filter(p => p.completed && p.type === 'quiz').length;
    const studyTime = safeUserData.studyTime || 0;
    const name = safeUserData.name || 'طالب';
    const code = safeUserData.code || '---';
    const grade = safeUserData.grade || 'لم يحدد';
    const streak = safeUserData.streak || 0;
    const perfectExams = safeUserData.perfectExams || 0;

    let errorCount = 0;
    let errorQuestions = [];
    
    window.database.ref('users/' + window.currentUser.uid + '/errorBank').once('value', (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            if (Array.isArray(data)) {
                const unsolvedErrors = data.filter(e => !e.solved);
                errorCount = unsolvedErrors.length;
                errorQuestions = unsolvedErrors.slice(0, 5);
            }
        }
        renderRealAnalysis();
    });

    function renderRealAnalysis() {
        const totalActivity = completedLessons + examsCompleted + quizzesCompleted;
        
        if (totalActivity === 0) {
            main.innerHTML = `
                <div style="max-width:900px;margin:0 auto;padding:16px;">
                    <button class="btn-outline btn-sm no-print" onclick="APP.showDashboard()">
                        <i class="fas fa-arrow-right"></i> العودة
                    </button>
                    <div style="text-align:center;padding:40px;background:var(--card);border-radius:var(--radius-lg);border:1px solid var(--border);margin-top:16px;">
                        <div style="font-size:4rem;">📊</div>
                        <h2 style="font-family:'Lalezar',cursive;font-size:2rem;color:var(--text);">لا توجد بيانات كافية للتحليل</h2>
                        <p style="color:var(--text2);margin-top:8px;">ابدأ في مشاهدة الدروس وحل الاختبارات لتظهر لك الإحصائيات.</p>
                        <button class="btn-primary" style="margin-top:16px;" onclick="APP.scrollToCourses()">📚 ابدأ التعلم الآن</button>
                    </div>
                </div>
            `;
            return;
        }

        const totalAttempts = examsCompleted + quizzesCompleted;
        const successRate = totalAttempts > 0 ? Math.round((examsCompleted + quizzesCompleted) / (examsCompleted + quizzesCompleted + errorCount) * 100) : 0;
        const lessonProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        
        let level = 'مبتدئ 🌱';
        let levelColor = 'var(--danger)';
        let levelDesc = 'أنت في بداية الطريق، استمر في التعلم!';
        
        if (atoms > 500 && lessonProgress > 70 && perfectExams > 2) {
            level = 'متقدم 🚀';
            levelColor = 'var(--success)';
            levelDesc = 'مستوى ممتاز! أنت على الطريق الصحيح!';
        } else if (atoms > 200 && lessonProgress > 40 && perfectExams > 0) {
            level = 'متوسط 📈';
            levelColor = 'var(--warning)';
            levelDesc = 'أداء جيد، استمر في التحسين!';
        } else if (atoms > 50 && lessonProgress > 20) {
            level = 'مبتدئ متقدم 🌱';
            levelColor = '#FFA726';
            levelDesc = 'بداية ممتازة، استمر في المذاكرة!';
        }
        
        const strengths = [];
        if (atoms > 100) strengths.push(`⚛️ لديك ${atoms} ذرة`);
        if (successRate > 70) strengths.push(`📈 نسبة نجاح ${successRate}%`);
        if (completedLessons > 10) strengths.push(`📚 شاهدت ${completedLessons} حصة`);
        if (examsCompleted > 3) strengths.push(`📝 حللت ${examsCompleted} امتحان`);
        if (quizzesCompleted > 5) strengths.push(`🧪 حللت ${quizzesCompleted} كويز`);
        if (streak > 3) strengths.push(`🔥 درست ${streak} يوم متتالي`);
        if (perfectExams > 0) strengths.push(`💯 ${perfectExams} امتحان ممتاز`);
        
        if (strengths.length === 0) strengths.push('🌟 ابدأ رحلتك واكتشف نقاط قوتك!');
        
        const weaknesses = [];
        const recommendations = [];
        
        if (atoms < 50) {
            weaknesses.push('⚛️ حاول جمع المزيد من الذرات');
            recommendations.push('📝 حل امتحانات وكويزات للحصول على ذرات');
        }
        if (successRate < 50 && totalAttempts > 0) {
            weaknesses.push(`📈 نسبة نجاح ${successRate}% - حاول التحسين`);
            recommendations.push('📖 راجع الدروس جيداً قبل حل الامتحانات');
        }
        if (completedLessons < 5) {
            weaknesses.push('📚 شاهد المزيد من الحصص');
            recommendations.push('🎥 ابدأ بمشاهدة الحصص المتاحة');
        }
        if (errorCount > 3) {
            weaknesses.push(`❌ لديك ${errorCount} خطأ في بنك الأخطاء`);
            recommendations.push('🔴 راجع أخطاءك في بنك الأخطاء');
        }
        if (examsCompleted === 0) {
            weaknesses.push('📝 لم تحل أي امتحان بعد');
            recommendations.push('📝 حاول حل امتحان لقياس مستواك');
        }
        if (quizzesCompleted === 0) {
            weaknesses.push('🧪 لم تحل أي كويز بعد');
            recommendations.push('🧪 حل الكويزات لتعزيز فهمك');
        }
        if (streak === 0) {
            weaknesses.push('🔥 لم تبدأ الدراسة اليومية بعد');
            recommendations.push('🔥 ابدأ بالدراسة يومياً ولو 15 دقيقة');
        }
        if (perfectExams === 0) {
            recommendations.push('💯 حاول الحصول على 100% في امتحان');
        }
        
        if (weaknesses.length === 0) weaknesses.push('🌟 أنت في طريق ممتاز، استمر!');
        if (recommendations.length === 0) recommendations.push('🎉 ممتاز! أنت في الطريق الصحيح، استمر بنفس المستوى');

        let rank = '--';
        window.database.ref('users').orderByChild('atoms').startAt((window.userData?.atoms || 0) + 1).once('value', (snapshot) => {
            const rankNum = snapshot.numChildren() + 1;
            rank = '#' + rankNum;
            renderCompleteRealAnalysis(rank);
        }).catch(() => {
            renderCompleteRealAnalysis('--');
        });

        function renderCompleteRealAnalysis(rank) {
            const daysSince = safeUserData.createdAt ? Math.max(1, Math.floor((Date.now() - new Date(safeUserData.createdAt).getTime()) / (1000 * 60 * 60 * 24))) : 1;
            const dailyAverage = Math.round((studyTime / daysSince) * 10) / 10;
            
            main.innerHTML = `
                <div style="max-width:900px;margin:0 auto;padding:16px;">
                    <button class="btn-outline btn-sm no-print" onclick="APP.showDashboard()">
                        <i class="fas fa-arrow-right"></i> العودة
                    </button>
                    
                    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin:12px 0;">
                        <h1 style="font-family:'Lalezar',cursive;font-size:clamp(1.5rem,2.5vw,2.5rem);color:var(--text);">
                            🤖 تحليل مستواك الحقيقي
                        </h1>
                        <button class="btn-primary no-print" onclick="APP.printAIReport()">
                            <i class="fas fa-print"></i> 🖨️ طباعة التقرير
                        </button>
                    </div>
                    <p style="color:var(--text2);margin-bottom:16px;">
                        تحليل حقيقي 100% بناءً على أدائك الفعلي في المنصة
                    </p>

                    <div id="aiReportContent" class="ai-report-container">
                        <div class="report-header">
                            <div class="logo">يلا كيمياء</div>
                            <div class="title">📊 تقرير تحليل المستوى</div>
                            <div style="font-size:0.8rem;color:var(--text2);">
                                ${escapeHtml(name)} • ${escapeHtml(code)} • ${new Date().toLocaleDateString('ar')}
                            </div>
                        </div>

                        <div class="report-section" style="background:${levelColor}15;border:2px solid ${levelColor};">
                            <h4 style="color:${levelColor};">📈 مستواك الحالي</h4>
                            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;">
                                <div class="stat-item"><div class="label">المستوى</div><div class="value" style="font-size:1.5rem;color:${levelColor};">${level}</div></div>
                                <div class="stat-item"><div class="label">الترتيب</div><div class="value" style="font-size:1.5rem;color:var(--gold);">${rank}</div></div>
                                <div class="stat-item"><div class="label">الذرات</div><div class="value" style="font-size:1.5rem;color:var(--gold-dark);">${atoms}</div></div>
                            </div>
                            <div style="margin-top:8px;text-align:center;font-size:1rem;color:var(--text2);">${levelDesc}</div>
                        </div>

                        <div class="report-section">
                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                                <div>
                                    <h4 style="color:var(--success);">💪 نقاط القوة</h4>
                                    ${strengths.map(s => `<p style="font-size:0.85rem;margin:4px 0;">✅ ${s}</p>`).join('')}
                                </div>
                                <div>
                                    <h4 style="color:var(--danger);">📌 نقاط الضعف</h4>
                                    ${weaknesses.map(w => `<p style="font-size:0.85rem;margin:4px 0;">⚠️ ${w}</p>`).join('')}
                                </div>
                            </div>
                        </div>

                        <div class="report-section">
                            <h4>📊 إحصائياتك الحقيقية</h4>
                            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;">
                                <div class="stat-item"><div class="label">نسبة النجاح</div><div class="value" style="color:${successRate > 70 ? 'var(--success)' : 'var(--danger)'};">${successRate}%</div></div>
                                <div class="stat-item"><div class="label">عدد الأخطاء</div><div class="value" style="color:var(--danger);">${errorCount}</div></div>
                                <div class="stat-item"><div class="label">ساعات الدراسة</div><div class="value">${studyTime} س</div></div>
                                <div class="stat-item"><div class="label">متوسط يومي</div><div class="value">${dailyAverage} س</div></div>
                                <div class="stat-item"><div class="label">أيام متتالية</div><div class="value">${streak} يوم</div></div>
                                <div class="stat-item"><div class="label">نسبة الإنجاز</div><div class="value">${lessonProgress}%</div></div>
                                <div class="stat-item"><div class="label">امتحانات ممتازة</div><div class="value" style="color:var(--gold);">${perfectExams}</div></div>
                            </div>
                        </div>

                        <div class="report-section" style="background:var(--card);border:2px solid var(--primary);">
                            <h4 style="color:var(--primary);">📖 توصيات مخصصة لك</h4>
                            <ul style="list-style:disc;padding-right:20px;font-size:0.95rem;line-height:2.2;">
                                ${recommendations.map(r => `<li>${r}</li>`).join('')}
                            </ul>
                        </div>

                        ${errorCount > 0 ? `
                            <div class="report-section" style="border:2px solid var(--danger);">
                                <h4 style="color:var(--danger);">❌ أخطاؤك الحالية (${errorCount})</h4>
                                ${errorQuestions.slice(0, 5).map((e, idx) => `
                                    <div style="font-size:0.85rem;padding:4px 8px;background:var(--card);border-radius:var(--radius);margin:4px 0;border-right:3px solid var(--danger);">
                                        ${idx + 1}. ${escapeHtml(e.question)}
                                        <span style="color:var(--success);">(صحيح: ${escapeHtml(e.correctAnswer)})</span>
                                    </div>
                                `).join('')}
                                ${errorQuestions.length > 5 ? `<p style="font-size:0.8rem;color:var(--text2);">... و ${errorQuestions.length - 5} أسئلة أخرى</p>` : ''}
                                <button class="btn-primary btn-sm" style="margin-top:8px;" onclick="APP.showErrorBank()">
                                    📝 اذهب لبنك الأخطاء
                                </button>
                            </div>
                        ` : `
                            <div class="report-section" style="border:2px solid var(--success);">
                                <h4 style="color:var(--success);">🎉 ممتاز! لا توجد أخطاء</h4>
                                <p>كل إجاباتك صحيحة، استمر بهذا الأداء الرائع!</p>
                            </div>
                        `}

                        <div class="report-footer">
                            هذا التقرير مبني على بياناتك الفعلية في المنصة.
                            آخر تحديث: ${new Date().toLocaleDateString('ar')} - ${new Date().toLocaleTimeString('ar')}
                        </div>
                    </div>
                </div>
            `;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
}

function printAIReport() {
    const content = document.getElementById('aiReportContent');
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showToast('⚠️ يرجى السماح بالنوافذ المنبثقة', 'warning');
        return;
    }
    const styles = document.querySelector('style').innerHTML;
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>تقرير تحليل المستوى - يلا كيمياء</title>
            <style>
                ${styles}
                body { padding: 20px; background: #fff; }
                .no-print { display: none !important; }
                .ai-report-container { box-shadow: none !important; border: 1px solid #ddd !important; }
                .btn, .back-top, .navbar { display: none !important; }
                @media print {
                    body { padding: 0; }
                    .ai-report-container { border: 1px solid #ddd !important; }
                }
            </style>
        </head>
        <body>
            ${content.outerHTML}
            <script>
                window.onload = function() {
                    window.print();
                }
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function openLessonExam(lessonId) {
    showToast('جاري فتح الامتحان...', 'info');
}

function openLessonQuiz(lessonId) {
    showToast('جاري فتح الكويز...', 'info');
}

function openExamSecurityModal() {
    document.getElementById('examSecurityModal').classList.add('open');
}

function closeExamSecurityModal() {
    document.getElementById('examSecurityModal').classList.remove('open');
}

function startExamAfterPledge() {
    closeExamSecurityModal();
    if (window.pendingExamCallback) {
        window.pendingExamCallback();
        window.pendingExamCallback = null;
    }
}

function submitExam(id, maxAtoms, autoSubmit) {
    showToast('جاري تقديم الامتحان...', 'info');
}

function submitQuiz(id, maxAtoms, autoSubmit) {
    showToast('جاري تقديم الكويز...', 'info');
}

function exitExam() {
    showToast('تم الخروج من الامتحان', 'info');
}

function navigateExamQuestion(direction) {}

function navigateQuizQuestion(direction) {}

function selectExamAnswer(questionIndex, optionIndex) {}

function selectQuizAnswer(questionIndex, optionIndex) {}

function renderExamUI(exam, startTime, duration) {
    showToast('جاري تجهيز الامتحان...', 'info');
}

window.showErrorBank = showErrorBank;
window.startErrorReview = startErrorReview;
window.generateOptions = generateOptions;
window.showResults = showResults;
window.showCertificate = showCertificate;
window.downloadCertificate = downloadCertificate;
window.showStudentCard = showStudentCard;
window.downloadStudentCard = downloadStudentCard;
window.getAchievements = getAchievements;
window.showAchievements = showAchievements;
window.showAIInsights = showAIInsights;
window.printAIReport = printAIReport;
window.openLessonExam = openLessonExam;
window.openLessonQuiz = openLessonQuiz;
window.openExamSecurityModal = openExamSecurityModal;
window.closeExamSecurityModal = closeExamSecurityModal;
window.startExamAfterPledge = startExamAfterPledge;
window.submitExam = submitExam;
window.submitQuiz = submitQuiz;
window.exitExam = exitExam;
window.navigateExamQuestion = navigateExamQuestion;
window.navigateQuizQuestion = navigateQuizQuestion;
window.selectExamAnswer = selectExamAnswer;
window.selectQuizAnswer = selectQuizAnswer;
window.renderExamUI = renderExamUI;
