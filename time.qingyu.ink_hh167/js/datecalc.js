/**
 * Date Calculator — calculate difference between two dates
 */
(function () {
    const startInput   = document.getElementById('dcStart');
    const endInput     = document.getElementById('dcEnd');
    const calcBtn      = document.getElementById('dcCalc');
    const todayStart   = document.getElementById('dcTodayStart');
    const todayEnd     = document.getElementById('dcTodayEnd');
    const resultDiv    = document.getElementById('dcResult');
    const totalDaysEl  = document.getElementById('dcTotalDays');
    const yearsEl      = document.getElementById('dcYears');
    const monthsEl     = document.getElementById('dcMonths');
    const daysEl       = document.getElementById('dcDays');
    const detailEl     = document.getElementById('dcDetail');

    function setToday(input) {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        input.value = `${y}-${m}-${d}`;
    }

    function formatDate(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function calculateDiff(startDate, endDate) {
        let years = endDate.getFullYear() - startDate.getFullYear();
        let months = endDate.getMonth() - startDate.getMonth();
        let days = endDate.getDate() - startDate.getDate();

        // 循环借位：当月日不够时，逐月回退直到 days >= 0
        let refDate = new Date(endDate);
        while (days < 0) {
            // 回退到上一个月的最后一天
            const prevMonthLastDay = new Date(refDate.getFullYear(), refDate.getMonth(), 0);
            days += prevMonthLastDay.getDate();
            months--;
            refDate.setMonth(refDate.getMonth() - 1);
        }

        if (months < 0) {
            months += 12;
            years--;
        }

        return { years: Math.max(0, years), months: Math.max(0, months), days };
    }

    function calculate() {
        const startVal = startInput.value;
        const endVal = endInput.value;

        if (!startVal || !endVal) {
            resultDiv.classList.remove('show');
            // Highlight empty fields
            if (!startVal) startInput.style.borderColor = 'var(--red)';
            if (!endVal) endInput.style.borderColor = 'var(--red)';
            setTimeout(() => {
                startInput.style.borderColor = '';
                endInput.style.borderColor = '';
            }, 1500);
            return;
        }

        const startDate = new Date(startVal + 'T00:00:00');
        const endDate = new Date(endVal + 'T00:00:00');

        const totalDays = Math.abs(Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)));
        const earlier = startDate < endDate ? startDate : endDate;
        const later = startDate < endDate ? endDate : startDate;
        const diff = calculateDiff(earlier, later);

        totalDaysEl.textContent = totalDays;
        yearsEl.textContent = diff.years;
        monthsEl.textContent = diff.months;
        daysEl.textContent = diff.days;

        detailEl.innerHTML = `
            📌 从 <strong>${formatDate(earlier)}</strong> 到 <strong>${formatDate(later)}</strong><br>
            ⏱ 共 <strong>${totalDays}</strong> 天
            ${diff.years > 0 ? `（${diff.years}年${diff.months}月${diff.days}日）` : ''}
        `;

        resultDiv.classList.add('show');
    }

    calcBtn.addEventListener('click', calculate);

    todayStart.addEventListener('click', () => {
        setToday(startInput);
    });

    todayEnd.addEventListener('click', () => {
        setToday(endInput);
    });

    // Set today as end date by default
    setToday(endInput);

    // Enter key triggers calculation
    [startInput, endInput].forEach(input => {
        input.addEventListener('keypress', e => {
            if (e.key === 'Enter') calculate();
        });
        input.addEventListener('input', () => {
            input.style.borderColor = '';
        });
    });
})();
