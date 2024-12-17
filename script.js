const clientId = 'YOUR_CLIENT_ID';
const redirectUri = 'https://givonar.github.io/Spot/';

let accessToken;
let userName;

const loginButton = document.getElementById('loginButton');
const downloadButton = document.getElementById('downloadButton');
const loginStatus = document.getElementById('loginStatus');
const downloadProgress = document.getElementById('downloadProgress');

loginButton.addEventListener('click', () => {
    const scope = 'user-library-read user-read-email';
    let url = 'https://accounts.spotify.com/authorize';
    url += '?response_type=token';
    url += '&client_id=' + encodeURIComponent(clientId);
    url += '&scope=' + encodeURIComponent(scope);
    url += '&redirect_uri=' + encodeURIComponent(redirectUri);
    window.open(url, '_blank');
});

function handleRedirect() {
    let hash = window.location.hash.substr(1);
    const result = hash.split('&').reduce(function (res, item) {
        const parts = item.split('=');
        res[parts[0]] = decodeURIComponent(parts[1]);
        return res;
    }, {});

    accessToken = result.access_token;
    if (accessToken) {
        fetchUserData();
        loginButton.style.display = 'none';
        downloadButton.style.display = 'inline-block';
    }
}

async function fetchUserData() {
    const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    });
    const data = await response.json();
    userName = data.id; // Use user's id as username for file naming
    updateLoginStatus(data.images[0]?.url);
}

function updateLoginStatus(imageUrl) {
    if (imageUrl) {
        loginStatus.innerHTML = `<img src="${imageUrl}" alt="Profile">`;
    } else {
        loginStatus.textContent = 'وارد شوید';
        loginStatus.onclick = () => window.open(loginButton.onclick());
    }
}

window.onload = handleRedirect;

downloadButton.addEventListener('click', async () => {
    if (!accessToken) return alert('ابتدا باید لاگین کنید.');

    try {
        let songs = [];
        let offset = 0;
        let total = 1; // Just to enter the loop
        let currentSong = 0;

        const response = await fetch(`https://api.spotify.com/v1/me/tracks?limit=50&offset=${offset}`, {
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        });
        const data = await response.json();
        total = data.total;

        while (songs.length < total) {
            const response = await fetch(`https://api.spotify.com/v1/me/tracks?limit=50&offset=${offset}`, {
                headers: {
                    'Authorization': 'Bearer ' + accessToken
                }
            });
            const data = await response.json();
            songs = songs.concat(data.items);
            offset += 50;
            currentSong = songs.length;
            downloadProgress.textContent = `${currentSong}/${total}`;
        }

        let textContent = '';
        songs.forEach(item => {
            textContent += item.track.external_urls.spotify + '\n';
        });

        const blob = new Blob([textContent], {type: 'text/plain'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${userName}_liked_songs.txt`;
        link.click();
        downloadProgress.textContent = ''; // Clear progress after download

    } catch (error) {
        console.error('خطا در دریافت آهنگ‌ها:', error);
        alert('مشکلی پیش آمده، لطفا دوباره تلاش کنید.');
    }
});
