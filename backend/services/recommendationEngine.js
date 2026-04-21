import AssessmentType from "../models/AssessmentType.js";

/**
 * Generates gentle suggestions for specialized assessments based on general assessment results.
 * @param {Number} totalScore - The score from the general assessment
 * @param {Object} category - The category label and recommendation from general assessment
 * @returns {Array} List of recommended specialized assessment types
 */
export const getRecommendations = async (totalScore, category) => {
    const recommendations = [];

    // Logic based on the SRS:
    // If high stress -> suggest Stress assessment
    // If poor sleep -> suggest Sleep assessment
    // If burnout indicators -> suggest Burnout test

    // We can fetch specialized assessment types from the DB
    const specializedTypes = await AssessmentType.find({ isSpecialized: true });

    if (category) {
        const label = category.label.toLowerCase();

        if (label.includes("stress") || totalScore > 20) {
            const stressTest = specializedTypes.find(t => t.name.toLowerCase().includes("stress"));
            if (stressTest) {
                recommendations.push({
                    typeId: stressTest._id,
                    name: stressTest.name,
                    message: "We've noticed high stress levels. You might find our specialized Stress Assessment helpful."
                });
            }
        }

        if (label.includes("sleep") || totalScore > 15) {
            const sleepTest = specializedTypes.find(t => t.name.toLowerCase().includes("sleep"));
            if (sleepTest) {
                recommendations.push({
                    typeId: sleepTest._id,
                    name: sleepTest.name,
                    message: "Improving sleep quality can significantly boost your well-being. Consider taking our Sleep Assessment."
                });
            }
        }

        if (label.includes("burnout") || totalScore > 25) {
            const burnoutTest = specializedTypes.find(t => t.name.toLowerCase().includes("burnout"));
            if (burnoutTest) {
                recommendations.push({
                    typeId: burnoutTest._id,
                    name: burnoutTest.name,
                    message: "You seem to be showing signs of burnout. Our Burnout Test can provide more specific insights."
                });
            }
        }
    }

    return recommendations;
};
