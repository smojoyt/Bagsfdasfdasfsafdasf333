document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById('couponForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const data = Object.fromEntries(new FormData(form).entries());

        const res = await fetch('https://hook.us2.make.com/mebf3tl39n3o3gx11ywaeta6f7eo1yja', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const messageBox = document.getElementById('couponMessage');
        const messageText = messageBox.querySelector('p');
        const useNowBtn = messageBox.querySelector('a');

        if (res.ok) {
            const json = await res.json();

            form.style.display = 'none';
            messageBox.classList.remove('hidden');

            const { status, code, expires, message } = json;

            if (status === 'used') {
                messageText.innerHTML = `
                    <span class="block text-lg font-semibold text-red-600">You’ve used your coupon!</span>
                    <span class="text-sm text-gray-700">Your code <strong class="text-black">${code}</strong> has already been redeemed.</span>
                `;
                useNowBtn.classList.remove('hidden');

            } else if (status === 'expired') {
                messageText.innerHTML = `
                    <span class="block text-lg font-semibold text-red-600">Your previous coupon has expired.</span>
                    <span class="text-sm text-gray-700">Code <strong class="text-black">${code}</strong> expired on <strong>${expires}</strong>.</span>
                `;
                useNowBtn.classList.add('hidden');

            } else if (status === 'active') {
                messageText.innerHTML = `
                    <span class="block text-lg font-semibold text-green-700">🎉 Your coupon has already been claimed!</span>
                    <span class="text-sm text-gray-700">Your code is: <strong class="text-black">${code}</strong> and expires <strong>${expires}</strong>.</span>
                `;
                useNowBtn.classList.remove('hidden');

            } else if (status === 'new') {
                messageText.innerHTML = `
                    <span class="block text-lg font-semibold text-green-700">🎉 Welcome! Your coupon has been created!</span>
                    <span class="text-sm text-gray-700">Your code is: <strong class="text-black">${code}</strong> and expires on <strong>${expires}</strong>.</span>
                `;
                useNowBtn.classList.remove('hidden');

            } else {
                messageText.textContent = message || 'Something unexpected happened.';
                useNowBtn.classList.add('hidden');
            }
        } else {
            alert('Something went wrong. Please try again.');
        }
    });
});
