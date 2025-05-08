'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCompletePage() {
    const router = useRouter();

    useEffect(() => {
        if (window.opener) {
            window.opener.postMessage('auth-success', '*');
            window.close();
        } else {
            router.push('/');
        }
    }, []);

    return <p>Đang xử lý ...</p>;
}
