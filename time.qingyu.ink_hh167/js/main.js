// 三横线菜单控制
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const menuItems = document.querySelectorAll('.sidebar-menu li');
const clockPage = document.getElementById('clockPage');
const calcPage = document.getElementById('calcPage');

// 打开/关闭侧边栏
menuBtn.addEventListener('click', () => {
    menuBtn.classList.toggle('active');
    sidebar.classList.toggle('show');
    overlay.classList.toggle('show');
});

// 点击遮罩关闭侧边栏
overlay.addEventListener('click', () => {
    closeSidebar();
});

// 菜单切换页面
menuItems.forEach(item => {
    item.addEventListener('click', () => {
        menuItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        const page = item.dataset.page;
        if(page === 'clock') {
            clockPage.style.display = 'flex';
            calcPage.style.display = 'none';
        } else {
            clockPage.style.display = 'none';
            calcPage.style.display = 'flex';
        }
        
        closeSidebar();
    });
});

// 关闭侧边栏函数
function closeSidebar() {
    menuBtn.classList.remove('active');
    sidebar.classList.remove('show');
    overlay.classList.remove('show');
}

// 时钟功能
function updateClock() {
    const now = new Date();
    
    let hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    document.getElementById('hours').textContent = hours;
    document.getElementById('minutes').textContent = minutes;
    document.getElementById('seconds').textContent = seconds;
    
    const date = now.getDate().toString().padStart(2, '0');
    const year = now.getFullYear();
    const month = now.toLocaleString('zh-CN', { month: 'long' });
    
    document.getElementById('date').textContent = date;
    document.getElementById('month').textContent = month;
    document.getElementById('year').textContent = year + '年';
    
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[now.getDay()];
    document.getElementById('weekday').textContent = weekday;
}

updateClock();
setInterval(updateClock, 1000);

// 日期计算器功能
document.getElementById('calculate-btn').addEventListener('click', function() {
    const startDateInput = document.getElementById('start-date').value;
    const endDateInput = document.getElementById('end-date').value;
    const startError = document.getElementById('start-error');
    const endError = document.getElementById('end-error');
    const resultElement = document.getElementById('result');
    
    startError.style.display = 'none';
    endError.style.display = 'none';
    
    if (!startDateInput || !endDateInput) {
        if (!startDateInput) startError.style.display = 'block';
        if (!endDateInput) endError.style.display = 'block';
        resultElement.style.display = 'none';
        return;
    }
    
    const startDate = new Date(startDateInput);
    const endDate = new Date(endDateInput);
    
    const totalDays = Math.abs(Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)));
    const diff = calculateDateDiff(startDate, endDate);
    
    document.getElementById('total-days').textContent = totalDays;
    document.getElementById('calc-years').textContent = diff.years;
    document.getElementById('calc-months').textContent = diff.months;
    document.getElementById('calc-days').textContent = diff.days;
    
    const isFuture = endDate > startDate;
    const detailsText = isFuture ? 
        `从 ${formatDate(startDate)} 到 ${formatDate(endDate)}` :
        `从 ${formatDate(endDate)} 到 ${formatDate(startDate)}`;
    document.getElementById('calc-details').textContent = detailsText;
    
    resultElement.style.display = 'block';
});

function calculateDateDiff(startDate, endDate) {
    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();
    
    if (days < 0) {
        const lastDayOfPrevMonth = new Date(
            endDate.getFullYear(), 
            endDate.getMonth(), 
            0
        ).getDate();
        
        days += lastDayOfPrevMonth;
        months--;
    }
    
    if (months < 0) {
        months += 12;
        years--;
    }
    
    return { years, months, days };
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

document.getElementById('start-date').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') document.getElementById('calculate-btn').click();
});

document.getElementById('end-date').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') document.getElementById('calculate-btn').click();
});