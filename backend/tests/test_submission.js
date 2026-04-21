// Using native fetch

async function testSubmission() {
    const payload = {
        user: { email: "guest@mindcare.com" },
        answers: {
            screen1: {
                // We'll need real IDs here if we want it to actually save,
                // but even with fake ones we should see if it still hits the same error.
                "65d49f1a2b3c4d5e6f7a8b9c": { points: 2, option_id: "65d4a01a2b3c4d5e6f7a8b9d" }
            }
        }
    };

    try {
        const res = await fetch('http://localhost:5000/api/assessment-attempts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        console.log('Submission Response:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Test Failed:', err.message);
    }
}

testSubmission();
