let card = document.querySelector('.container .card');

// 例如，点击图鉴时解锁(测试版)
card.addEventListener('click', function() {
    card.classList.remove('locked');
    card.classList.add('unlocked');
});