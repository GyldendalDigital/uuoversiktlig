/**
 * Fetch metadata from activity to be indexed alongside the e2e test results
 *
 * @param {import("puppeteer/lib/types.js").Page} page
 */
export const runActivityDataTest = async (page) =>
  await page.evaluate(() => {
    // @ts-ignore
    const initialState = window.initialState;
    const activity = initialState?.activity;
    if (activity) {
      const getActivityThumbnail = (activity) => {
        const damImage =
          activity.thumbnailDetails ??
          activity.backgroundImageDetails ??
          (activity.scenes ? activity.scenes[0]?.backgroundImageDetails : null);

        return {
          id: damImage?.id,
          mimeType: damImage?.mimeType,
        };
      };

      return {
        learningMaterials: activity.learningMaterials,
        learningComponents: activity.learningComponents,
        subjects: activity.subjects,
        grades: activity.grades,
        differentiations: activity.differentiations,
        interdisciplinaryTopics: activity.interdisciplinaryTopics,
        topics: activity.topics,

        studentVisible: activity.studentVisible,
        thumbnail: getActivityThumbnail(activity),
        mode: initialState.originalActivityMode,
        sceneCount: activity.scenes?.length || 0,
        sectionElementTags: initialState.sectionElementTags,
        isMissingTitle: !activity.title?.value,
        parentDocumentTypes: initialState.parentDocumentTypes,
      };
    }
  });
