const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

// The QUINCE Engine: Core Residual Logic
const calculateResidualReflection = (currentIntent, prevIntent) => {
    const gain = 0.85; // Our 'r' coefficient
    // Predicting the next state based on the velocity of intent
    // Simple mock implementation for the prototype
    if (!currentIntent || !prevIntent) return currentIntent;

    // Assume 3D vector for hand position [x, y, z]
    const predicted = currentIntent.vector.map((val, i) => {
        const delta = val - (prevIntent.vector[i] || 0);
        return val + (gain * delta);
    });
    return predicted;
};

exports.onIntentCreated = onDocumentCreated("Latent_Events/{eventId}", async (event) => {
    const data = event.data.data();
    const architectId = data.architect_id;

    if (!architectId) return;

    // 1. Fetch the Previous Intent State for recursion
    const lastIntentSnapshot = await db.collection('Latent_Events')
        .where('architect_id', '==', architectId)
        .orderBy('timestamp', 'desc')
        .limit(2)
        .get();

    if (lastIntentSnapshot.empty || lastIntentSnapshot.docs.length < 2) {
        return;
    }

    const prevIntent = lastIntentSnapshot.docs[1].data();

    // 2. Calculate the "Antigravity" Speculative State
    // We use the 'payload' field as per the schema
    const predictedState = calculateResidualReflection(data.payload, prevIntent.payload);

    // 3. Update the speculative_buffer
    await db.collection('Speculative_State').doc(architectId).set({
        predicted_vector: predictedState,
        timestamp: FieldValue.serverTimestamp(),
        status: 'ANTICIPATING'
    });
});
