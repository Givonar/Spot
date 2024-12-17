const clientId = 'YOUR_CLIENT_ID';
const redirectUri = 'http://localhost:8888/callback'; // این را با آدرس سایت خود جایگزین کنید

let accessToken;

const loginButton = document.getElementById('loginButton');
const downloadButton = document.getElementById('downloadButton');

loginButton.addEventListener('click', () => {
    const scope = 'user-library-read';
    let url = 'https://accounts.spotify.com/authorize';
    url += '?response_type=token';
    url += '&client_id=' + encodeURIComponent(clientId);
    url += '&scope=' + encodeURIComponent(scope);
    url += '&redirect_uri=' + encodeURIComponent(redirectUri);
    window.location = url;
});

function handleRedirect() {
    let hash = window.location.hash.substr(1);
    const result = hash.split('&').reduce(function (res, item) {
        const parts = item.split('=');
        res[parts[0]] = decodeURIComponent(parts[1]);
        return res;
    }, {});

    accessToken = result.access_token;
    loginButton.style.display = 'none';
    downloadButton.style.display = 'inline-block';
}

window.onload = handleRedirect;

downloadButton.addEventListener('click', async () => {
    if (!accessToken) return alert('ابتدا باید لاگین کنید.');

    try {
        let songs = [];
        let offset = 0;
        let total = 1; // Just to enter the loop

        while (songs.length < total) {
            const response = await fetch(`https://api.spotify.com/v1/me/tracks?limit=50&offset=${offset}`, {
                headers: {
                    'Authorization': 'Bearer ' + accessToken
                }
            });
            const data = await response.json();
            total = data.total;
            songs = songs.concat(data.items);
            offset += 50;
        }

        let textContent = '';
        songs.forEach(item => {
            textContent += item.track.external_urls.spotify + '\n';
        });

        const blob = new Blob([textContent], {type: 'text/plain'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'liked_songs.txt';
        link.click();
    } catch (error) {
        console.error('خطا در دریافت آهنگ‌ها:', error);
        alert('مشکلی پیش آمده، لطفا دوباره تلاش کنید.');
    }
});
