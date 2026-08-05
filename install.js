// ============================================================
// 📁 ملف: install.js
// ============================================================
// كود التثبيت - ضعه في ملف منفصل واربطه في app.html
// ============================================================

let deferredPrompt = null;
let isAppInstalled = false;

// ====== 1. تسجيل Service Worker ======
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('✅ Service Worker registered successfully');
            })
            .catch(function(error) {
                console.warn('⚠️ Service Worker registration failed:', error);
            });
    });
}

// ====== 2. استقبال حدث التثبيت من المتصفح ======
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('✅ beforeinstallprompt triggered - PWA install available');
    
    // إظهار زر التثبيت في النافبار
    const installBtn = document.getElementById('installAppBtn');
    if (installBtn) {
        installBtn.style.display = 'flex';
        installBtn.innerHTML = '<i class="fas fa-download"></i> 📲 حمل التطبيق';
        installBtn.style.background = 'linear-gradient(135deg, #FFD60A, #F59E0B)';
        installBtn.style.animation = 'pulse-install 1.5s infinite';
        installBtn.style.cursor = 'pointer';
        installBtn.onclick = function() { installApp(); };
    }
    
    // إظهار زر التثبيت في الهيرو (الصفحة الرئيسية)
    const heroBtn = document.getElementById('heroInstallBtn');
    if (heroBtn) {
        heroBtn.style.display = 'flex';
        heroBtn.onclick = function() { installApp(); };
    }
});

// ====== 3. دالة التثبيت الأساسية ======
function installApp() {
    // المحاولة الأولى: التثبيت التلقائي عبر متصفح PWA
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                showToast('✅ تم تثبيت التطبيق بنجاح!', 'success');
                
                // إخفاء أزرار التثبيت بعد التثبيت
                const installBtn = document.getElementById('installAppBtn');
                if (installBtn) {
                    installBtn.innerHTML = '✅ تم تثبيت التطبيق';
                    installBtn.style.background = 'linear-gradient(135deg, #22C55E, #16A34A)';
                    installBtn.style.animation = 'none';
                    installBtn.style.cursor = 'default';
                    installBtn.onclick = null;
                }
                
                const heroBtn = document.getElementById('heroInstallBtn');
                if (heroBtn) {
                    heroBtn.innerHTML = '✅ تم تثبيت التطبيق';
                    heroBtn.style.background = 'linear-gradient(135deg, #22C55E, #16A34A)';
                    heroBtn.style.animation = 'none';
                    heroBtn.style.cursor = 'default';
                    heroBtn.onclick = null;
                }
                
                const banner = document.getElementById('pwaInstallBanner');
                if (banner) {
                    banner.classList.remove('visible');
                    banner.style.display = 'none';
                }
            } else {
                showToast('❌ تم إلغاء التثبيت', 'warning');
            }
            deferredPrompt = null;
        });
        return;
    }
    
    // المحاولة الثانية: تثبيت عبر Safari (iOS)
    if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('CriOS')) {
        if (navigator.share) {
            navigator.share({
                title: 'يلا كيمياء',
                text: '📱 ثبّت التطبيق على جهازك الآن!\nاضغط على زر المشاركة ⬆ ثم اختر "إضافة للشاشة الرئيسية"',
                url: window.location.href
            }).catch(() => {});
        } else {
            showToast('📱 اضغط على ⬆ ثم "إضافة للشاشة الرئيسية"', 'info');
        }
        return;
    }

    // المحاولة الثالثة: تعليمات تثبيت مخصصة حسب الجهاز
    showInstallInstructions();
}

// ====== 4. تعليمات التثبيت حسب الجهاز ======
function showInstallInstructions() {
    const userAgent = navigator.userAgent;
    let instructions = '';

    if (/android/i.test(userAgent)) {
        instructions = '📱 لتثبيت التطبيق على Android:\n\n' +
                      '1️⃣ افتح المتصفح (Chrome أو Edge)\n' +
                      '2️⃣ اضغط على القائمة (⋮) في أعلى يمين الشاشة\n' +
                      '3️⃣ اختر "تثبيت التطبيق" أو "Add to Home Screen"\n' +
                      '4️⃣ اضغط على "تثبيت" لتأكيد التثبيت';
    } else if (/iphone|ipad|ipod/i.test(userAgent)) {
        instructions = '📱 لتثبيت التطبيق على iPhone/iPad:\n\n' +
                      '1️⃣ افتح المتصفح (Safari)\n' +
                      '2️⃣ اضغط على زر المشاركة ⬆ في أسفل الشاشة\n' +
                      '3️⃣ انتقل لليسار واختر "إضافة للشاشة الرئيسية"\n' +
                      '4️⃣ اضغط على "إضافة" لتأكيد التثبيت';
    } else if (/windows|mac/i.test(userAgent)) {
        instructions = '💻 لتثبيت التطبيق على الكمبيوتر:\n\n' +
                      '• Chrome/Edge: اضغط على أيقونة التثبيت 📲 في شريط العنوان\n' +
                      '• أو اضغط على "Install" في قائمة المتصفح\n' +
                      '• يمكنك أيضاً إضافة الموقع إلى المفضلة';
    } else {
        instructions = '📲 لتثبيت التطبيق:\n\n' +
                      '• Android: اضغط على ⋮ ثم "تثبيت التطبيق"\n' +
                      '• iPhone: اضغط على ⬆ ثم "إضافة للشاشة الرئيسية"\n' +
                      '• كمبيوتر: اضغط على + أو 📲 في شريط العنوان';
    }

    alert(instructions);
}

// ====== 5. التحقق من وضع التثبيت (Standalone) ======
function updateInstallButtonVisibility() {
    const installBtn = document.getElementById('installAppBtn');
    if (!installBtn) return;

    // إذا كان التطبيق مثبتاً بالفعل، نخفي الزر
    if (window.matchMedia('(display-mode: standalone)').matches) {
        installBtn.innerHTML = '✅ تم تثبيت التطبيق';
        installBtn.style.background = 'linear-gradient(135deg, #22C55E, #16A34A)';
        installBtn.style.animation = 'none';
        installBtn.style.cursor = 'default';
        installBtn.onclick = null;
        
        const heroBtn = document.getElementById('heroInstallBtn');
        if (heroBtn) {
            heroBtn.innerHTML = '✅ تم تثبيت التطبيق';
            heroBtn.style.background = 'linear-gradient(135deg, #22C55E, #16A34A)';
            heroBtn.style.animation = 'none';
            heroBtn.style.cursor = 'default';
            heroBtn.onclick = null;
        }
        return;
    }

    // إذا كان لدينا deferredPrompt، نظهر الزر
    if (deferredPrompt) {
        installBtn.style.display = 'flex';
        installBtn.innerHTML = '<i class="fas fa-download"></i> 📲 حمل التطبيق';
        installBtn.style.background = 'linear-gradient(135deg, #FFD60A, #F59E0B)';
        installBtn.style.animation = 'pulse-install 1.5s infinite';
        installBtn.style.cursor = 'pointer';
        installBtn.onclick = installApp;
        return;
    }

    // في المتصفحات التي تدعم PWA ولكن لم يتم تفعيلها بعد
    if ('serviceWorker' in navigator && 'Notification' in window) {
        installBtn.style.display = 'flex';
        installBtn.innerHTML = '<i class="fas fa-download"></i> 📲 حمل التطبيق';
        installBtn.style.background = 'linear-gradient(135deg, #FFD60A, #F59E0B)';
        installBtn.style.animation = 'pulse-install 1.5s infinite';
        installBtn.style.cursor = 'pointer';
        installBtn.onclick = installApp;
    }
}

// ====== 6. الاستماع لتغيير وضع العرض ======
window.addEventListener('DOMContentLoaded', function() {
    updateInstallButtonVisibility();

    // مراقبة التغيير في وضع العرض
    window.matchMedia('(display-mode: standalone)').addEventListener('change', function(e) {
        if (e.matches) {
            const installBtn = document.getElementById('installAppBtn');
            if (installBtn) {
                installBtn.innerHTML = '✅ تم تثبيت التطبيق';
                installBtn.style.background = 'linear-gradient(135deg, #22C55E, #16A34A)';
                installBtn.style.animation = 'none';
                installBtn.style.cursor = 'default';
                installBtn.onclick = null;
            }
            const heroBtn = document.getElementById('heroInstallBtn');
            if (heroBtn) {
                heroBtn.innerHTML = '✅ تم تثبيت التطبيق';
                heroBtn.style.background = 'linear-gradient(135deg, #22C55E, #16A34A)';
                heroBtn.style.animation = 'none';
                heroBtn.style.cursor = 'default';
                heroBtn.onclick = null;
            }
        } else {
            updateInstallButtonVisibility();
        }
    });
});

// ====== 7. تحديث الزر عند تغيير حالة الموقع ======
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        updateInstallButtonVisibility();
    }
});

console.log('✅ كود التثبيت تم تحميله بنجاح');
