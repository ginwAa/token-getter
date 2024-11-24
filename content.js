document.addEventListener('keydown', function(event) {
    if (event.code === 'F12') {
        const cookies = document.cookie;
        if (cookies) {
            const cookieArray = cookies.split(`;`);
            cookieArray.forEach(cookie => {
                const trimCookie = cookie.trim();
                const [key, val] = trimCookie.split(`=`);
                if (key && val !== undefined && key === `Authorization` &&val.includes(`bearer`)) {
                    const token = val.substring(9);
                    navigator.clipboard.writeText(token);
                }
            })
        }
    }

})