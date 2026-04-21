import Category from "../Category.js";

/**
 * Maps a score to a category for a given assessment type.
 * @param {String} assessment_type_id 
 * @param {Number} score 
 */
export const getCategoryForScore = async (assessment_type_id, score) => {
  const categories = await Category.find({ assessment_type_id }).sort({ min_score: 1 });

  for (const category of categories) {
    if (score >= category.min_score && score <= category.max_score) {
      return category;
    }
  }

  // Fallback for floating point gaps: find the closest category if score is between ranges
  if (categories.length > 0) {
    if (score < categories[0].min_score) return categories[0];
    if (score > categories[categories.length - 1].max_score) return categories[categories.length - 1];

    for (let i = 0; i < categories.length - 1; i++) {
      if (score > categories[i].max_score && score < categories[i + 1].min_score) {
        // Tie-break: return the next category if it's very close
        return categories[i + 1];
      }
    }
  }

  return null;
};