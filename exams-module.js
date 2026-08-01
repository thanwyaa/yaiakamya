// ============================================================
// EXAMS, QUIZZES & ASSIGNMENTS MODULE
// ============================================================

// ===== متغيرات خاصة بالامتحانات =====
let examTimer = null;
let examStartTime = null;
let isExamActive = false;
let examSubmitted = false;
let examAnswers = {};
let quizAnswers = {};
let currentExamId = null;
let currentExamData = null;
let currentQuizData = null;
let pendingExamCallback = null;
let isExamMode = false;

// ============================================================
// دوال الامتحانات والكويزات والواجبات
// ============================================================

// ===== التحقق من إكمال الامتحان/الكويز =====
async function isAssessmentCompleted(lessonId, type) {
    const key = type === 'exam' ? 'exam_' + lessonId : 'quiz_' + lessonId;
    if (userCourseProgress[key]?.completed) return true;
    const snapshot = await database.ref(`users/${currentUser.uid}/progress/${key}`).once('value');
    if (snapshot.exists() && snapshot.val().completed) {
        userCourseProgress[key] = snapshot.val();
        cache.progress = userCourseProgress;
        updateCache();
        return true;
    }
    return false;
}

// ===== فتح امتحان الحصة =====
async function openLessonExam(lessonId) {
    if (!currentUser) { showLoginOverlay(); return; }
    if (await isAssessmentCompleted(lessonId, 'exam')) { showCompletedModal(); return; }
    try {
        const lesson = allLessons.find(l => l.id === lessonId);
        if (lesson) {
            const course = allCourses.find(c => c.id === lesson.courseId);
            if (course && course.isFree === false && !isPremiumCourse(course.id)) {
                showSubscriptionPage(course.id);
                return;
            }
        }
        const snapshot = await database.ref('exams').orderByChild('lessonId').equalTo(lessonId).once('value');
        if (!snapshot.exists()) { showToast('⚠️ لا يوجد امتحان لهذه الحصة', 'warning'); return; }
        let exam = null;
        snapshot.forEach(child => { exam = { id: child.key, ...child.val() }; });
        if (!exam) { showToast('⚠️ حدث خطأ في تحميل الامتحان', 'error'); return; }
        currentExamData = exam;
        openExamSecurityModal(lessonId, function() { showExamUI(exam, true); }, 'exam');
    } catch (err) { console.error('openLessonExam error:', err);
        showToast('حدث خطأ في تحميل الامتحان: ' + err.message, 'error'); }
}

// ===== فتح كويز الحصة =====
async function openLessonQuiz(lessonId) {
    if (!currentUser) { showLoginOverlay(); return; }
    if (await isAssessmentCompleted(lessonId, 'quiz')) { showCompletedModal(); return; }
    try {
        const lesson = allLessons.find(l => l.id === lessonId);
        if (lesson) {
            const course = allCourses.find(c => c.id === lesson.courseId);
            if (course && course.isFree === false && !isPremiumCourse(course.id)) {
                showSubscriptionPage(course.id);
                return;
            }
        }
        const snapshot = await database.ref('quizzes').orderByChild('lessonId').equalTo(lessonId).once('value');
        if (!snapshot.exists()) { showToast('⚠️ لا يوجد كويز لهذه الحصة', 'warning'); return; }
        let quiz = null;
        snapshot.forEach(child => { quiz = { id: child.key, ...child.val() }; });
        if (!quiz) { showToast('⚠️ حدث خطأ في تحميل الكويز', 'error'); return; }
        currentQuizData = quiz;
        openExamSecurityModal(lessonId, function() { showQuizUI(quiz, true); }, 'quiz');
    } catch (err) { console.error('openLessonQuiz error:', err);
        showToast('حدث خطأ في تحميل الكويز: ' + err.message, 'error'); }
}

// ===== فتح واجب الحصة =====
async function openLessonAssignment(lessonId) {
    if (!currentUser) { showLoginOverlay(); return; }
    const progressKey = 'assignment_' + lessonId;
    if (userCourseProgress[progressKey]?.completed) { showCompletedModal(); return; }
    try {
        const lesson = allLessons.find(l => l.id === lessonId);
        if (lesson) {
            const course = allCourses.find(c => c.id === lesson.courseId);
            if (course && course.isFree === false && !isPremiumCourse(course.id)) {
                showSubscriptionPage(course.id);
                return;
            }
        }
        const snapshot = await database.ref('assignments/' + lessonId).once('value');
        if (!snapshot.exists()) { showToast('الواجب غير موجود', 'error'); return; }
        const assign = { id: lessonId, ...snapshot.val() };
        const main = document.getElementById('mainContent');
        if (!main) return;
        main.innerHTML = `
            <div style="max-width:800px;margin:0 auto;padding:20px;">
                <button class="btn-outline btn-sm no-print" onclick="APP.showHome()"><i class="fas fa-arrow-right"></i> العودة</button>
                <h2 style="font-family:'Lalezar',cursive;font-size:1.5rem;color:var(--text);margin:12px 0 4px;">📚 ${escapeHtml(assign.title)}</h2>
                <p style="color:var(--text2);margin-bottom:12px;">${escapeHtml(assign.description) || ''}</p>
                <div class="card" style="padding:16px;margin-bottom:12px;">
                    <p style="color:var(--text);"><strong>الدرجة:</strong> ${assign.grade || 10}</p>
                    <p style="color:var(--text);"><strong>الحالة:</strong> <span style="color:var(--warning);">⏳ في انتظار التقييم</span></p>
                    ${assign.content ? `<div style="margin-top:8px;padding:12px;background:var(--bg);border-radius:var(--radius);color:var(--text);">${escapeHtml(assign.content)}</div>` : ''}
                    <button class="btn-primary" style="margin-top:12px;width:100%;" onclick="APP.completeAssignment('${lessonId}')"><i class="fas fa-check"></i> تسليم الواجب</button>
                </div>
                <div style="text-align:center;"><button class="btn-primary no-print" onclick="APP.showHome()">🏠 العودة للرئيسية</button></div>
            </div>
        `;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) { console.error('openLessonAssignment error:', err);
        showToast('حدث خطأ في تحميل الواجب', 'error'); }
}

// ===== تسليم الواجب =====
async function completeAssignment(lessonId) {
    if (!currentUser) return;
    const progressKey = 'assignment_' + lessonId;
    if (userCourseProgress[progressKey]?.completed) { showCompletedModal(); return; }
    try {
        const atomsReward = 10;
        const userRef = database.ref('users/' + currentUser.uid);
        const userSnap = await userRef.once('value');
        if (userSnap.exists()) {
            const currentAtoms = userSnap.val().atoms || 0;
            await database.ref('users/' + currentUser.uid + '/progress/' + progressKey).set({ completed: true, completedAt: new Date().toISOString(), type: 'assignment', atomsAwarded: atomsReward });
            const resultRef = database.ref('users/' + currentUser.uid + '/results').push();
            await resultRef.set({ title: 'واجب الحصة', type: 'assignment', score: 100, totalQuestions: 1, correctAnswers: 1, wrongAnswers: 0, timeSpent: 0, atomsEarned: atomsReward, completedAt: new Date().toISOString(), lessonId: lessonId });
            await userRef.update({ atoms: currentAtoms + atomsReward });
            if (userData) userData.atoms = currentAtoms + atomsReward;
            cache.userData = userData;
            updateCache();
            animateAtoms('atomsCount', currentAtoms + atomsReward);
            animateAtoms('userAtomsCount', currentAtoms + atomsReward);
            await addNotification(currentUser.uid, '📝 تم تسليم الواجب!', `حصلت على ${atomsReward} ذرة لتسليم الواجب.`, '📝');
            showToast(`🎉 +${atomsReward} ذرة! تم تسليم الواجب بنجاح.`, 'success');
            const main = document.getElementById('mainContent');
            if (main) {
                main.innerHTML = `<div style="max-width:800px;margin:0 auto;padding:20px;text-align:center;">
                    <div style="font-size:4rem;">✅</div>
                    <h2 style="font-family:'Lalezar',cursive;font-size:1.8rem;color:var(--success);">تم تسليم الواجب بنجاح!</h2>
                    <p style="color:var(--text2);margin-top:8px;">حصلت على ${atomsReward} ذرة.</p>
                    <button class="btn-primary" style="margin-top:16px;" onclick="APP.showHome()">🏠 العودة للرئيسية</button>
                </div>`;
            }
        }
    } catch (err) { console.error('Error completing assignment:', err);
        showToast('حدث خطأ في تسليم الواجب', 'error'); }
}

// ===== عرض واجهة الامتحان =====
function showExamUI(exam, isSecure = false) {
    const main = document.getElementById('mainContent');
    if (!main) return;
    const questions = exam.questions || [];
    if (questions.length === 0) { showToast('لا توجد أسئلة في هذا الامتحان', 'warning'); return; }
    if (userCourseProgress['exam_' + (exam.lessonId || exam.id)]?.completed) { showCompletedModal(); return; }

    examStartTime = Date.now();
    let duration = exam.duration || 0;
    let timeLeft = duration * 60;

    examAnswers[exam.id] = {};
    isExamActive = true;
    examSubmitted = false;
    isExamMode = true;

    let currentQuestion = 0;
    let answeredQuestions = new Set();

    if (duration > 0) {
        if (examTimer) clearInterval(examTimer);
        examTimer = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0 && !examSubmitted) {
                clearInterval(examTimer);
                examTimer = null;
                isExamActive = false;
                submitExam(exam.id, exam.atomsReward || 10, true);
                showToast('⏰ انتهى الوقت! تم تسليم الامتحان تلقائياً.', 'warning');
                return;
            }
            const mins = Math.floor(timeLeft / 60);
            const secs = timeLeft % 60;
            const timerEl = document.getElementById('examTimer');
            if (timerEl) {
                timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                timerEl.className = 'exam-timer';
                if (timeLeft < 30) { timerEl.classList.add('danger'); } else if (timeLeft < 60) { timerEl.classList.add('warning'); }
            }
        }, 1000);
    }

    // دالة اختيار الإجابة
    window.selectExamAnswer = function(id, qIdx, oIdx, correct) {
        if (!isExamActive || examSubmitted) return;
        if (!examAnswers[id]) examAnswers[id] = {};
        const container = document.getElementById('examContainer');
        if (container) {
            const divs = container.querySelectorAll('.question-card');
            if (divs[qIdx]) {
                const options = divs[qIdx].querySelectorAll('.quiz-option');
                options.forEach((el, index) => {
                    const radio = el.querySelector('input[type="radio"]');
                    if (radio) { radio.checked = index === oIdx; }
                    el.classList.remove('selected', 'correct', 'wrong');
                });
                options[oIdx].classList.add('selected');
            }
        }
        examAnswers[id][qIdx] = { selected: oIdx, correct: correct };
        answeredQuestions.add(qIdx);
        const countEl = document.getElementById('answeredCount');
        if (countEl) countEl.textContent = `${answeredQuestions.size} / ${questions.length} تمت الإجابة`;
    };

    const renderQuestion = (index) => {
        const q = questions[index];
        if (!q) return;
        const divs = document.querySelectorAll('.question-card');
        divs.forEach((d, i) => { d.style.display = i === index ? 'block' : 'none'; });
        document.getElementById('questionProgress').textContent = `${index + 1} / ${questions.length}`;
        document.getElementById('prevQuestion').style.display = index > 0 ? 'inline-flex' : 'none';
        document.getElementById('nextQuestion').style.display = index < questions.length - 1 ? 'inline-flex' : 'none';
    };

    let questionsHtml = questions.map((q, idx) => `
        <div class="question-card" style="display:${idx === 0 ? 'block' : 'none'};">
            <div class="card" style="padding:16px;margin-bottom:10px;">
                <p style="font-weight:700;color:var(--text);margin-bottom:12px;font-size:1.1rem;">
                    ${idx + 1}. ${escapeHtml(q.question)}
                    ${q.image ? `<br><div class="quiz-image-container" onclick="event.stopPropagation(); APP.openImageZoom('${q.image}')">
                        <img src="${q.image}" style="max-width:100%;max-height:200px;border-radius:var(--radius);margin-top:8px;cursor:pointer;" loading="lazy">
                        <span class="zoom-icon">🔍 تكبير</span>
                    </div>` : ''}
                </p>
                <div style="display:flex;flex-direction:column;gap:6px;">
                    ${q.options.map((opt, oIdx) => `
                        <div class="quiz-option" onclick="APP.selectExamAnswer('${exam.id}', ${idx}, ${oIdx}, ${q.correctAnswer})">
                            <input type="radio" name="exam_q${idx}" id="exam_q${idx}_${oIdx}" value="${oIdx}">
                            <span style="width:24px;height:24px;border-radius:50%;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;color:var(--text2);flex-shrink:0;">${String.fromCharCode(65 + oIdx)}</span>
                            <span class="option-label">${escapeHtml(opt)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');

    main.innerHTML = `
        <div style="max-width:800px;margin:0 auto;padding:16px;">
            <button class="btn-outline btn-sm no-print" onclick="APP.exitExam()"><i class="fas fa-arrow-right"></i> الخروج</button>
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin:12px 0;">
                <h2 style="font-family:'Lalezar',cursive;font-size:1.5rem;color:var(--text);">📝 ${escapeHtml(exam.title)}</h2>
                ${duration > 0 ? `
                    <div class="exam-timer" id="examTimerWrapper">
                        <i class="fas fa-clock"></i> 
                        <span id="examTimer">${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}</span>
                    </div>
                ` : ''}
            </div>
            <p style="color:var(--text2);margin-bottom:12px;">${escapeHtml(exam.description) || ''}</p>
            <p style="color:var(--gold);font-weight:700;margin-bottom:12px;">⭐ ${exam.atomsReward || 10} ذرة عند النجاح</p>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <span style="font-size:0.85rem;color:var(--text2);">السؤال <span id="questionProgress">1 / ${questions.length}</span></span>
                <span style="font-size:0.85rem;color:var(--text2);" id="answeredCount">${answeredQuestions.size} / ${questions.length} تمت الإجابة</span>
            </div>
            <div id="examContainer">${questionsHtml}</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;justify-content:space-between;">
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="btn-outline btn-sm" id="prevQuestion" onclick="APP.navigateExamQuestion(-1)" style="display:${questions.length > 1 ? 'inline-flex' : 'none'}"><i class="fas fa-chevron-right"></i> السابق</button>
                    <button class="btn-outline btn-sm" id="nextQuestion" onclick="APP.navigateExamQuestion(1)">التالي <i class="fas fa-chevron-left"></i></button>
                </div>
                <button class="btn-primary" id="submitExamBtn" onclick="APP.submitExam('${exam.id}', ${exam.atomsReward || 10})" style="display:inline-flex;"><i class="fas fa-check"></i> تسليم الامتحان</button>
            </div>
        </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    examAnswers[exam.id] = {};
}

// ===== التنقل بين أسئلة الامتحان =====
function navigateExamQuestion(direction) {
    const cards = document.querySelectorAll('.question-card');
    let current = 0;
    cards.forEach((c, i) => { if (c.style.display !== 'none') current = i; });
    const next = Math.max(0, Math.min(current + direction, cards.length - 1));
    cards.forEach((c, i) => { c.style.display = i === next ? 'block' : 'none'; });
    document.getElementById('questionProgress').textContent = `${next + 1} / ${cards.length}`;
    document.getElementById('prevQuestion').style.display = next > 0 ? 'inline-flex' : 'none';
    document.getElementById('nextQuestion').style.display = next < cards.length - 1 ? 'inline-flex' : 'none';
}

// ===== تسليم الامتحان =====
async function submitExam(id, maxAtoms, autoSubmit = false) {
    if (!currentUser) { showLoginOverlay(); return; }
    const progressKey = 'exam_' + (currentExamData?.lessonId || id);
    if (userCourseProgress[progressKey]?.completed) { showCompletedModal(); return; }
    if (examSubmitted) { showToast('تم تسليم الامتحان بالفعل', 'info'); return; }

    const answers = examAnswers[id] || {};
    const totalQuestions = currentExamData?.questions?.length || 0;
    if (Object.keys(answers).length < totalQuestions && !autoSubmit) {
        showToast(`⚠️ الرجاء الإجابة على جميع الأسئلة (${totalQuestions - Object.keys(answers).length} متبقي)`, 'error');
        return;
    }

    if (examTimer) { clearInterval(examTimer);
        examTimer = null; }
    isExamActive = false;
    examSubmitted = true;
    isExamMode = false;

    try {
        const snapshot = await database.ref('exams/' + id).once('value');
        if (!snapshot.exists()) { showToast('المحتوى غير موجود', 'error'); return; }
        const data = snapshot.val();
        const questions = data.questions || [];

        let correct = 0;
        let total = Math.min(Object.keys(answers).length, questions.length);
        let wrongQuestions = [];
        let results = [];
        for (let i = 0; i < total; i++) {
            const isCorrect = answers[i] && answers[i].selected === questions[i].correctAnswer;
            if (isCorrect) { correct++; } else {
                wrongQuestions.push({ question: questions[i].question, correctAnswer: questions[i].options[questions[i].correctAnswer], userAnswer: questions[i].options[answers[i]?.selected] || 'لم يجب' });
            }
            results.push({ question: questions[i].question, userAnswer: questions[i].options[answers[i]?.selected] || 'لم يجب', correctAnswer: questions[i].options[questions[i].correctAnswer], isCorrect: isCorrect, explanation: questions[i].explanation || '' });
        }
        const score = Math.round((correct / total) * 100);
        const earnedAtoms = Math.round((score / 100) * maxAtoms);
        const timeSpent = Math.floor((Date.now() - examStartTime) / 1000);

        const progressRef = database.ref('users/' + currentUser.uid + '/progress/' + progressKey);
        await progressRef.set({ completed: true, score: score, atomsAwarded: earnedAtoms, completedAt: new Date().toISOString(), type: 'exam', totalQuestions: total, correctAnswers: correct, wrongAnswers: wrongQuestions.length, timeSpent: timeSpent, title: data.title || 'امتحان', results: results });

        const resultRef = database.ref('users/' + currentUser.uid + '/results').push();
        await resultRef.set({ title: data.title || 'امتحان', type: 'exam', score: score, totalQuestions: total, correctAnswers: correct, wrongAnswers: wrongQuestions.length, timeSpent: timeSpent, atomsEarned: earnedAtoms, completedAt: new Date().toISOString(), lessonId: data.lessonId || id, examId: id });

        if (earnedAtoms > 0) {
            const atomRef = database.ref('users/' + currentUser.uid + '/atoms');
            await atomRef.transaction((current) => { return (current || 0) + earnedAtoms; });
            const userSnap = await database.ref('users/' + currentUser.uid + '/atoms').once('value');
            const newAtoms = userSnap.val() || 0;
            if (userData) userData.atoms = newAtoms;
            cache.userData = userData;
            updateCache();
            animateAtoms('atomsCount', newAtoms);
            animateAtoms('userAtomsCount', newAtoms);
        }

        if (score === 100) {
            const perfectRef = database.ref('users/' + currentUser.uid + '/perfectExams');
            await perfectRef.transaction((current) => { return (current || 0) + 1; });
            if (userData) userData.perfectExams = (userData.perfectExams || 0) + 1;
        }

        if (wrongQuestions.length > 0) {
            const errorRef = database.ref('users/' + currentUser.uid + '/errorBank');
            const existingErrors = await errorRef.once('value');
            let errors = existingErrors.val() || [];
            wrongQuestions.forEach(wq => {
                const exists = errors.some(e => e.question === wq.question && !e.solved);
                if (!exists) { errors.push({ ...wq, addedAt: new Date().toISOString(), solved: false, attempts: 1, source: 'exam', sourceId: id }); } else {
                    const idx = errors.findIndex(e => e.question === wq.question && !e.solved);
                    if (idx !== -1) { errors[idx].attempts = (errors[idx].attempts || 1) + 1; }
                }
            });
            await errorRef.set(errors);
        }

        await database.ref(`users/${currentUser.uid}/examSessions/${id}`).remove();

        userCourseProgress[progressKey] = { completed: true, score: score, atomsAwarded: earnedAtoms, completedAt: new Date().toISOString(), type: 'exam', totalQuestions: total, correctAnswers: correct, wrongAnswers: wrongQuestions.length, results: results };
        cache.progress = userCourseProgress;
        updateCache();

        showExamResults(id, score, correct, wrongQuestions.length, results, earnedAtoms);
        await addNotification(currentUser.uid, '📝 تم إكمال امتحان!', `لقد أكملت امتحان "${data.title || 'الامتحان'}" وحصلت على ${earnedAtoms} ذرة.`, '📝');
    } catch (err) { console.error('submitExam error:', err);
        showToast('حدث خطأ أثناء تصحيح الامتحان: ' + err.message, 'error');
        isExamActive = true;
        examSubmitted = false;
        isExamMode = true; }
}

// ===== عرض نتيجة الامتحان =====
function showExamResults(examId, score, correct, wrong, results, atomsEarned) {
    const main = document.getElementById('mainContent');
    if (!main) return;
    const timeSpent = Math.floor((Date.now() - examStartTime) / 60);
    let message = '',
        emoji = '',
        gradeColor = '',
        detailedMessage = '';
    if (score === 100) { message = '🌟 ممتاز جداً، إجابة كاملة، استمر بهذا المستوى.';
        emoji = '🏆';
        gradeColor = 'var(--gold)';
        detailedMessage = 'رائع جداً، إجابة كاملة. استمر بهذا المستوى المتميز!'; } else if (score >= 90) { message = '🎉 أداء رائع جداً، اقتربت من العلامة الكاملة.';
        emoji = '🌟';
        gradeColor = 'var(--gold)';
        detailedMessage = 'أداء رائع جداً، أنت على بعد خطوة من الكمال!'; } else if (score >= 80) { message = '👏 ممتاز، استمر وستصل إلى الدرجة النهائية.';
        emoji = '⭐';
        gradeColor = 'var(--success)';
        detailedMessage = 'ممتاز، استمر في التحسين للوصول إلى الكمال!'; } else if (score >= 70) { message = '👍 جيد جداً، راجع بعض النقاط البسيطة.';
        emoji = '💪';
        gradeColor = 'var(--primary)';
        detailedMessage = 'جيد جداً، راجع بعض النقاط البسيطة وحسّن أدائك!'; } else if (score >= 60) { message = '📚 جيد، لكن تحتاج إلى مراجعة بعض الدروس.';
        emoji = '📖';
        gradeColor = 'var(--warning)';
        detailedMessage = 'جيد، لكن تحتاج إلى مراجعة بعض الدروس لتحسين الفهم.'; } else if (score >= 50) { message = '⚠️ مقبول، ننصح بإعادة مراجعة الدرس قبل المتابعة.';
        emoji = '⚠️';
        gradeColor = '#FFA726';
        detailedMessage = 'مقبول، ننصح بإعادة مراجعة الدرس قبل المتابعة.'; } else { message = '❌ تحتاج إلى مراجعة الدرس بالكامل ثم إعادة التدريب.';
        emoji = '🔴';
        gradeColor = 'var(--danger)';
        detailedMessage = 'تحتاج إلى مراجعة شاملة للدرس من البداية وإعادة التدريب.'; }

    const wrongResults = results.filter(r => !r.isCorrect);
    main.innerHTML = `
        <div style="max-width:900px;margin:0 auto;padding:20px;">
            <button class="btn-outline btn-sm no-print" onclick="APP.showHome()"><i class="fas fa-arrow-right"></i> العودة للرئيسية</button>
            <div class="card" style="padding:28px;margin-top:12px;text-align:center;border:3px solid ${gradeColor};">
                <div style="font-size:4rem;margin-bottom:8px;">${emoji}</div>
                <h2 style="font-family:'Lalezar',cursive;font-size:2.2rem;color:${gradeColor};">${score >= 50 ? '✅ نجاح' : '❌ يحتاج مراجعة'}</h2>
                <p style="font-size:1.3rem;color:var(--text);margin-top:10px;font-weight:700;">${message}</p>
                <p style="font-size:1.1rem;color:var(--primary);margin-top:4px;font-weight:600;">📊 ${detailedMessage}</p>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:16px;margin-top:20px;">
                    <div style="background:var(--bg);padding:16px;border-radius:var(--radius);"><div style="font-size:2rem;font-weight:700;color:var(--primary);">${score}%</div><div style="font-size:0.85rem;color:var(--text2);">الدرجة</div></div>
                    <div style="background:var(--bg);padding:16px;border-radius:var(--radius);border:2px solid var(--success);"><div style="font-size:2rem;font-weight:700;color:var(--success);">${correct}</div><div style="font-size:0.85rem;color:var(--text2);">✅ إجابة صحيحة</div></div>
                    <div style="background:var(--bg);padding:16px;border-radius:var(--radius);border:2px solid var(--danger);"><div style="font-size:2rem;font-weight:700;color:var(--danger);">${wrong}</div><div style="font-size:0.85rem;color:var(--text2);">❌ إجابة خاطئة</div></div>
                    <div style="background:var(--bg);padding:16px;border-radius:var(--radius);"><div style="font-size:2rem;font-weight:700;color:var(--warning);">${timeSpent} د</div><div style="font-size:0.85rem;color:var(--text2);">⏱ الوقت المستغرق</div></div>
                    ${atomsEarned > 0 ? `<div style="background:var(--bg);padding:16px;border-radius:var(--radius);border:2px solid var(--gold);"><div style="font-size:2rem;font-weight:700;color:var(--gold);">+${atomsEarned}</div><div style="font-size:0.85rem;color:var(--text2);">⚛️ ذرات مكتسبة</div></div>` : ''}
                </div>
                <div style="margin-top:12px;font-size:0.85rem;color:var(--text2);">📅 ${new Date().toLocaleDateString('ar')} • ${new Date().toLocaleTimeString('ar')}</div>
            </div>
            ${wrongResults.length > 0 ? `
                <h3 style="font-weight:700;font-size:1.2rem;color:var(--danger);margin:20px 0 12px;">❌ الأسئلة الخاطئة (${wrongResults.length})</h3>
                ${wrongResults.map((r, idx) => `
                    <div class="exam-result-card" style="border-right:4px solid var(--danger);">
                        <div class="question-text">${idx + 1}. ${escapeHtml(r.question)}</div>
                        <div class="answer-row">
                            <span class="wrong-icon">❌</span>
                            <span>إجابتك: <span class="user-ans">${escapeHtml(r.userAnswer)}</span></span>
                            <span>→</span>
                            <span>الإجابة الصحيحة: <span class="correct-ans">${escapeHtml(r.correctAnswer)}</span></span>
                        </div>
                        ${r.explanation ? `<div class="explanation">💡 ${escapeHtml(r.explanation)}</div>` : ''}
                    </div>
                `).join('')}
            ` : ''}
            <div style="text-align:center;margin-top:20px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
                <button class="btn-primary no-print" onclick="APP.showHome()">🏠 العودة للرئيسية</button>
                <button class="btn-outline no-print" onclick="APP.scrollToCourses()">📚 العودة للكورسات</button>
            </div>
        </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// دوال الكويزات (مع إصلاح الاختيار والتسليم)
// ============================================================

// ===== عرض واجهة الكويز =====
function showQuizUI(quiz, isSecure = false) {
    const main = document.getElementById('mainContent');
    if (!main) return;
    const questions = quiz.questions || [];
    if (questions.length === 0) { showToast('لا توجد أسئلة في هذا الكويز', 'warning'); return; }
    if (userCourseProgress['quiz_' + (quiz.lessonId || quiz.id)]?.completed) { showCompletedModal(); return; }

    examStartTime = Date.now();
    let duration = quiz.duration || 0;
    let timeLeft = duration * 60;

    quizAnswers[quiz.id] = {};
    isExamActive = true;
    examSubmitted = false;
    isExamMode = true;

    let currentQuestion = 0;
    let answeredQuestions = new Set();

    if (duration > 0) {
        if (examTimer) clearInterval(examTimer);
        examTimer = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0 && !examSubmitted) {
                clearInterval(examTimer);
                examTimer = null;
                isExamActive = false;
                submitQuiz(quiz.id, quiz.atomsReward || 5, true);
                showToast('⏰ انتهى الوقت! تم تسليم الكويز تلقائياً.', 'warning');
                return;
            }
            const mins = Math.floor(timeLeft / 60);
            const secs = timeLeft % 60;
            const timerEl = document.getElementById('quizTimer');
            if (timerEl) {
                timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                timerEl.className = 'exam-timer';
                if (timeLeft < 30) { timerEl.classList.add('danger'); } else if (timeLeft < 60) { timerEl.classList.add('warning'); }
            }
        }, 1000);
    }

    // دالة اختيار الإجابة (مربوطة بـ window و APP)
    window.selectQuizAnswer = function(id, qIdx, oIdx, correct) {
        if (!isExamActive || examSubmitted) {
            if (examSubmitted) showToast('تم تسليم الكويز بالفعل', 'info');
            return;
        }
        if (!quizAnswers[id]) quizAnswers[id] = {};
        const container = document.getElementById('quizContainer');
        if (container) {
            const divs = container.querySelectorAll('.quiz-question-card');
            if (divs[qIdx]) {
                const options = divs[qIdx].querySelectorAll('.quiz-option');
                options.forEach((el, index) => {
                    const radio = el.querySelector('input[type="radio"]');
                    if (radio) { radio.checked = index === oIdx; }
                    el.classList.remove('selected', 'correct', 'wrong');
                });
                options[oIdx].classList.add('selected');
            }
        }
        quizAnswers[id][qIdx] = { selected: oIdx, correct: correct };
        answeredQuestions.add(qIdx);
        const countEl = document.getElementById('quizAnsweredCount');
        if (countEl) {
            const total = questions.length;
            countEl.textContent = `${answeredQuestions.size} / ${total} تمت الإجابة`;
        }
    };

    // دالة التنقل بين الأسئلة
    const renderQuestion = (index) => {
        const q = questions[index];
        if (!q) return;
        const divs = document.querySelectorAll('.quiz-question-card');
        divs.forEach((d, i) => { d.style.display = i === index ? 'block' : 'none'; });
        document.getElementById('quizProgress').textContent = `${index + 1} / ${questions.length}`;
        document.getElementById('quizPrev').style.display = index > 0 ? 'inline-flex' : 'none';
        document.getElementById('quizNext').style.display = index < questions.length - 1 ? 'inline-flex' : 'none';
    };

    let questionsHtml = questions.map((q, idx) => `
        <div class="quiz-question-card" style="display:${idx === 0 ? 'block' : 'none'};">
            <div class="card" style="padding:16px;margin-bottom:10px;">
                <p style="font-weight:700;color:var(--text);margin-bottom:12px;font-size:1.1rem;">
                    ${idx + 1}. ${escapeHtml(q.question)}
                    ${q.image ? `<br><div class="quiz-image-container" onclick="event.stopPropagation(); APP.openImageZoom('${q.image}')">
                        <img src="${q.image}" style="max-width:100%;max-height:200px;border-radius:var(--radius);margin-top:8px;cursor:pointer;" loading="lazy">
                        <span class="zoom-icon">🔍 تكبير</span>
                    </div>` : ''}
                </p>
                <div style="display:flex;flex-direction:column;gap:6px;">
                    ${q.options.map((opt, oIdx) => `
                        <div class="quiz-option" onclick="APP.selectQuizAnswer('${quiz.id}', ${idx}, ${oIdx}, ${q.correctAnswer})">
                            <input type="radio" name="quiz_q${idx}" id="quiz_q${idx}_${oIdx}" value="${oIdx}">
                            <span style="width:24px;height:24px;border-radius:50%;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;color:var(--text2);flex-shrink:0;">${String.fromCharCode(65 + oIdx)}</span>
                            <span class="option-label">${escapeHtml(opt)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');

    main.innerHTML = `
        <div style="max-width:800px;margin:0 auto;padding:16px;">
            <button class="btn-outline btn-sm no-print" onclick="APP.exitExam()"><i class="fas fa-arrow-right"></i> الخروج</button>
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin:12px 0;">
                <h2 style="font-family:'Lalezar',cursive;font-size:1.5rem;color:var(--text);">🧪 ${escapeHtml(quiz.title)}</h2>
                ${duration > 0 ? `
                    <div class="exam-timer" id="quizTimerWrapper">
                        <i class="fas fa-clock"></i> 
                        <span id="quizTimer">${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}</span>
                    </div>
                ` : ''}
            </div>
            <p style="color:var(--text2);margin-bottom:12px;">${escapeHtml(quiz.description) || ''}</p>
            <p style="color:var(--gold);font-weight:700;margin-bottom:12px;">⭐ ${quiz.atomsReward || 5} ذرة عند النجاح</p>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <span style="font-size:0.85rem;color:var(--text2);">السؤال <span id="quizProgress">1 / ${questions.length}</span></span>
                <span style="font-size:0.85rem;color:var(--text2);" id="quizAnsweredCount">0 / ${questions.length} تمت الإجابة</span>
            </div>
            <div id="quizContainer">${questionsHtml}</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;justify-content:space-between;">
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="btn-outline btn-sm" id="quizPrev" onclick="APP.navigateQuizQuestion(-1)" style="display:${questions.length > 1 ? 'inline-flex' : 'none'}"><i class="fas fa-chevron-right"></i> السابق</button>
                    <button class="btn-outline btn-sm" id="quizNext" onclick="APP.navigateQuizQuestion(1)">التالي <i class="fas fa-chevron-left"></i></button>
                </div>
                <button class="btn-primary" id="submitQuizBtn" onclick="APP.submitQuiz('${quiz.id}', ${quiz.atomsReward || 5})" style="display:inline-flex;"><i class="fas fa-check"></i> تسليم الكويز</button>
            </div>
        </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    quizAnswers[quiz.id] = {};
}

// ===== التنقل بين أسئلة الكويز =====
function navigateQuizQuestion(direction) {
    const cards = document.querySelectorAll('.quiz-question-card');
    let current = 0;
    cards.forEach((c, i) => { if (c.style.display !== 'none') current = i; });
    const next = Math.max(0, Math.min(current + direction, cards.length - 1));
    cards.forEach((c, i) => { c.style.display = i === next ? 'block' : 'none'; });
    document.getElementById('quizProgress').textContent = `${next + 1} / ${cards.length}`;
    document.getElementById('quizPrev').style.display = next > 0 ? 'inline-flex' : 'none';
    document.getElementById('quizNext').style.display = next < cards.length - 1 ? 'inline-flex' : 'none';
}

// ===== تسليم الكويز (مع إعادة تحميل صفحة الكورس لإظهار علامة مكتمل) =====
async function submitQuiz(id, maxAtoms, autoSubmit = false) {
    if (!currentUser) { showLoginOverlay(); return; }
    const progressKey = 'quiz_' + (currentQuizData?.lessonId || id);
    if (userCourseProgress[progressKey]?.completed) { showCompletedModal(); return; }
    if (examSubmitted) { showToast('تم تسليم الكويز بالفعل', 'info'); return; }

    const answers = quizAnswers[id] || {};
    const totalQuestions = currentQuizData?.questions?.length || 0;
    if (Object.keys(answers).length < totalQuestions && !autoSubmit) {
        showToast(`⚠️ الرجاء الإجابة على جميع الأسئلة (${totalQuestions - Object.keys(answers).length} متبقي)`, 'error');
        return;
    }

    if (examTimer) { clearInterval(examTimer); examTimer = null; }
    isExamActive = false;
    examSubmitted = true;
    isExamMode = false;

    try {
        const snapshot = await database.ref('quizzes/' + id).once('value');
        if (!snapshot.exists()) { showToast('المحتوى غير موجود', 'error'); return; }
        const data = snapshot.val();
        const questions = data.questions || [];

        let correct = 0;
        let total = Math.min(Object.keys(answers).length, questions.length);
        let wrongQuestions = [];
        let results = [];
        for (let i = 0; i < total; i++) {
            const isCorrect = answers[i] && answers[i].selected === questions[i].correctAnswer;
            if (isCorrect) { correct++; } else {
                wrongQuestions.push({ question: questions[i].question, correctAnswer: questions[i].options[questions[i].correctAnswer], userAnswer: questions[i].options[answers[i]?.selected] || 'لم يجب' });
            }
            results.push({ question: questions[i].question, userAnswer: questions[i].options[answers[i]?.selected] || 'لم يجب', correctAnswer: questions[i].options[questions[i].correctAnswer], isCorrect: isCorrect, explanation: questions[i].explanation || '' });
        }
        const score = Math.round((correct / total) * 100);
        const earnedAtoms = Math.round((score / 100) * maxAtoms);
        const timeSpent = Math.floor((Date.now() - examStartTime) / 1000);

        const progressRef = database.ref('users/' + currentUser.uid + '/progress/' + progressKey);
        await progressRef.set({ completed: true, score: score, atomsAwarded: earnedAtoms, completedAt: new Date().toISOString(), type: 'quiz', totalQuestions: total, correctAnswers: correct, wrongAnswers: wrongQuestions.length, timeSpent: timeSpent, title: data.title || 'كويز', results: results });

        const resultRef = database.ref('users/' + currentUser.uid + '/results').push();
        await resultRef.set({ title: data.title || 'كويز', type: 'quiz', score: score, totalQuestions: total, correctAnswers: correct, wrongAnswers: wrongQuestions.length, timeSpent: timeSpent, atomsEarned: earnedAtoms, completedAt: new Date().toISOString(), lessonId: data.lessonId || id, quizId: id });

        if (earnedAtoms > 0) {
            const atomRef = database.ref('users/' + currentUser.uid + '/atoms');
            await atomRef.transaction((current) => { return (current || 0) + earnedAtoms; });
            const userSnap = await database.ref('users/' + currentUser.uid + '/atoms').once('value');
            const newAtoms = userSnap.val() || 0;
            if (userData) userData.atoms = newAtoms;
            cache.userData = userData;
            updateCache();
            animateAtoms('atomsCount', newAtoms);
            animateAtoms('userAtomsCount', newAtoms);
        }

        if (wrongQuestions.length > 0) {
            const errorRef = database.ref('users/' + currentUser.uid + '/errorBank');
            const existingErrors = await errorRef.once('value');
            let errors = existingErrors.val() || [];
            wrongQuestions.forEach(wq => {
                const exists = errors.some(e => e.question === wq.question && !e.solved);
                if (!exists) { errors.push({ ...wq, addedAt: new Date().toISOString(), solved: false, attempts: 1, source: 'quiz', sourceId: id }); } else {
                    const idx = errors.findIndex(e => e.question === wq.question && !e.solved);
                    if (idx !== -1) { errors[idx].attempts = (errors[idx].attempts || 1) + 1; }
                }
            });
            await errorRef.set(errors);
        }

        userCourseProgress[progressKey] = { completed: true, score: score, atomsAwarded: earnedAtoms, completedAt: new Date().toISOString(), type: 'quiz', totalQuestions: total, correctAnswers: correct, wrongAnswers: wrongQuestions.length, results: results };
        cache.progress = userCourseProgress;
        updateCache();

        showQuizResults(id, score, correct, wrongQuestions.length, results, earnedAtoms);
        await addNotification(currentUser.uid, '🧪 تم إكمال كويز!', `لقد أكملت كويز "${data.title || 'الكويز'}" وحصلت على ${earnedAtoms} ذرة.`, '🧪');

        // ===== إعادة تحميل صفحة الكورس لإظهار علامة "مكتمل" =====
        if (currentQuizData?.lessonId) {
            setTimeout(() => {
                const lesson = allLessons.find(l => l.id === currentQuizData.lessonId);
                if (lesson) openCoursePage(lesson.courseId);
                else showHome();
            }, 2000);
        }

    } catch (err) {
        console.error('submitQuiz error:', err);
        showToast('حدث خطأ أثناء تصحيح الكويز: ' + err.message, 'error');
        isExamActive = true;
        examSubmitted = false;
        isExamMode = true;
    }
}

// ===== عرض نتيجة الكويز =====
function showQuizResults(quizId, score, correct, wrong, results, atomsEarned) {
    const main = document.getElementById('mainContent');
    if (!main) return;
    const timeSpent = Math.floor((Date.now() - examStartTime) / 60);
    let message = '',
        emoji = '',
        gradeColor = '',
        detailedMessage = '';
    if (score === 100) { message = '🌟 ممتاز جداً، إجابة كاملة، استمر بهذا المستوى.';
        emoji = '🏆';
        gradeColor = 'var(--gold)';
        detailedMessage = 'رائع جداً، إجابة كاملة. استمر بهذا المستوى المتميز!'; } else if (score >= 90) { message = '🎉 أداء رائع جداً، اقتربت من العلامة الكاملة.';
        emoji = '🌟';
        gradeColor = 'var(--gold)';
        detailedMessage = 'أداء رائع جداً، أنت على بعد خطوة من الكمال!'; } else if (score >= 80) { message = '👏 ممتاز، استمر وستصل إلى الدرجة النهائية.';
        emoji = '⭐';
        gradeColor = 'var(--success)';
        detailedMessage = 'ممتاز، استمر في التحسين للوصول إلى الكمال!'; } else if (score >= 70) { message = '👍 جيد جداً، راجع بعض النقاط البسيطة.';
        emoji = '💪';
        gradeColor = 'var(--primary)';
        detailedMessage = 'جيد جداً، راجع بعض النقاط البسيطة وحسّن أدائك!'; } else if (score >= 60) { message = '📚 جيد، لكن تحتاج إلى مراجعة بعض الدروس.';
        emoji = '📖';
        gradeColor = 'var(--warning)';
        detailedMessage = 'جيد، لكن تحتاج إلى مراجعة بعض الدروس لتحسين الفهم.'; } else if (score >= 50) { message = '⚠️ مقبول، ننصح بإعادة مراجعة الدرس قبل المتابعة.';
        emoji = '⚠️';
        gradeColor = '#FFA726';
        detailedMessage = 'مقبول، ننصح بإعادة مراجعة الدرس قبل المتابعة.'; } else { message = '❌ تحتاج إلى مراجعة الدرس بالكامل ثم إعادة التدريب.';
        emoji = '🔴';
        gradeColor = 'var(--danger)';
        detailedMessage = 'تحتاج إلى مراجعة شاملة للدرس من البداية وإعادة التدريب.'; }

    const wrongResults = results.filter(r => !r.isCorrect);
    main.innerHTML = `
        <div style="max-width:900px;margin:0 auto;padding:20px;">
            <button class="btn-outline btn-sm no-print" onclick="APP.showHome()"><i class="fas fa-arrow-right"></i> العودة للرئيسية</button>
            <div class="card" style="padding:28px;margin-top:12px;text-align:center;border:3px solid ${gradeColor};">
                <div style="font-size:4rem;margin-bottom:8px;">${emoji}</div>
                <h2 style="font-family:'Lalezar',cursive;font-size:2.2rem;color:${gradeColor};">${score >= 50 ? '✅ نجاح' : '❌ يحتاج مراجعة'}</h2>
                <p style="font-size:1.3rem;color:var(--text);margin-top:10px;font-weight:700;">${message}</p>
                <p style="font-size:1.1rem;color:var(--primary);margin-top:4px;font-weight:600;">📊 ${detailedMessage}</p>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:16px;margin-top:20px;">
                    <div style="background:var(--bg);padding:16px;border-radius:var(--radius);"><div style="font-size:2rem;font-weight:700;color:var(--primary);">${score}%</div><div style="font-size:0.85rem;color:var(--text2);">الدرجة</div></div>
                    <div style="background:var(--bg);padding:16px;border-radius:var(--radius);border:2px solid var(--success);"><div style="font-size:2rem;font-weight:700;color:var(--success);">${correct}</div><div style="font-size:0.85rem;color:var(--text2);">✅ إجابة صحيحة</div></div>
                    <div style="background:var(--bg);padding:16px;border-radius:var(--radius);border:2px solid var(--danger);"><div style="font-size:2rem;font-weight:700;color:var(--danger);">${wrong}</div><div style="font-size:0.85rem;color:var(--text2);">❌ إجابة خاطئة</div></div>
                    <div style="background:var(--bg);padding:16px;border-radius:var(--radius);"><div style="font-size:2rem;font-weight:700;color:var(--warning);">${timeSpent} د</div><div style="font-size:0.85rem;color:var(--text2);">⏱ الوقت المستغرق</div></div>
                    ${atomsEarned > 0 ? `<div style="background:var(--bg);padding:16px;border-radius:var(--radius);border:2px solid var(--gold);"><div style="font-size:2rem;font-weight:700;color:var(--gold);">+${atomsEarned}</div><div style="font-size:0.85rem;color:var(--text2);">⚛️ ذرات مكتسبة</div></div>` : ''}
                </div>
                <div style="margin-top:12px;font-size:0.85rem;color:var(--text2);">📅 ${new Date().toLocaleDateString('ar')} • ${new Date().toLocaleTimeString('ar')}</div>
            </div>
            ${wrongResults.length > 0 ? `
                <h3 style="font-weight:700;font-size:1.2rem;color:var(--danger);margin:20px 0 12px;">❌ الأسئلة الخاطئة (${wrongResults.length})</h3>
                ${wrongResults.map((r, idx) => `
                    <div class="exam-result-card" style="border-right:4px solid var(--danger);">
                        <div class="question-text">${idx + 1}. ${escapeHtml(r.question)}</div>
                        <div class="answer-row">
                            <span class="wrong-icon">❌</span>
                            <span>إجابتك: <span class="user-ans">${escapeHtml(r.userAnswer)}</span></span>
                            <span>→</span>
                            <span>الإجابة الصحيحة: <span class="correct-ans">${escapeHtml(r.correctAnswer)}</span></span>
                        </div>
                        ${r.explanation ? `<div class="explanation">💡 ${escapeHtml(r.explanation)}</div>` : ''}
                    </div>
                `).join('')}
            ` : ''}
            <div style="text-align:center;margin-top:20px;">
                <button class="btn-primary no-print" onclick="APP.showHome()">🏠 العودة للرئيسية</button>
            </div>
        </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// دوال الأمان والعهد
// ============================================================

function openExamSecurityModal(examId, callback, type = 'exam') {
    const modal = document.getElementById('examSecurityModal');
    const titleEl = document.getElementById('examPledgeTitle');
    if (titleEl) { titleEl.textContent = type === 'quiz' ? '🧪 قبل بدء الكويز' : '📝 قبل بدء الاختبار'; }
    pendingExamCallback = callback;
    currentExamId = examId;
    modal.classList.add('open');
}

function closeExamSecurityModal() {
    document.getElementById('examSecurityModal').classList.remove('open');
    pendingExamCallback = null;
    currentExamId = null;
}

function startExamAfterPledge() {
    if (pendingExamCallback) {
        const callback = pendingExamCallback;
        const examIdToSave = currentExamId;
        pendingExamCallback = null;
        currentExamId = null;
        document.getElementById('examSecurityModal').classList.remove('open');
        if (currentUser && examIdToSave) {
            database.ref(`users/${currentUser.uid}/examPledges/${examIdToSave}`).set({ agreed: true, agreedAt: new Date().toISOString() }).catch(err => console.error('Error saving pledge:', err));
        }
        if (typeof callback === 'function') { callback(); } else { showToast('حدث خطأ داخلي، يرجى المحاولة مرة أخرى.', 'error'); }
    }
}

// ===== الخروج من الامتحان =====
function exitExam() {
    isExamMode = false;
    if (examTimer) { clearInterval(examTimer);
        examTimer = null; }
    showHome();
}

// ============================================================
// ربط الدوال بـ APP
// ============================================================

function bindExamFunctions() {
    if (window.APP) {
        APP.openLessonExam = openLessonExam;
        APP.openLessonQuiz = openLessonQuiz;
        APP.openLessonAssignment = openLessonAssignment;
        APP.completeAssignment = completeAssignment;
        APP.submitExam = submitExam;
        APP.submitQuiz = submitQuiz;
        APP.exitExam = exitExam;
        APP.navigateExamQuestion = navigateExamQuestion;
        APP.navigateQuizQuestion = navigateQuizQuestion;
        APP.selectExamAnswer = window.selectExamAnswer;
        APP.selectQuizAnswer = window.selectQuizAnswer;
        APP.openExamSecurityModal = openExamSecurityModal;
        APP.closeExamSecurityModal = closeExamSecurityModal;
        APP.startExamAfterPledge = startExamAfterPledge;
        APP.isAssessmentCompleted = isAssessmentCompleted;
        console.log('✅ Exam module loaded and bound to APP');
    } else {
        console.warn('⚠️ APP not found, retrying...');
        setTimeout(bindExamFunctions, 100);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindExamFunctions);
} else {
    bindExamFunctions();
}

console.log('📦 Exams Module loaded successfully');
