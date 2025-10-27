export class LabelUtilitySeeder {
  public static instance = new LabelUtilitySeeder();

  /**
   * Generate labels mapping and return mockLabelId
   */
  generateLabelsMapping(createdLabels: any[]): { createdLabelsMap: Record<string, any>; mockLabelId: string } {
    const createdLabelsMap: Record<string, any> = {};
    createdLabels.forEach((label: any) => {
      createdLabelsMap[label.name] = label;
    });
    const mockLabelId = createdLabelsMap['mock']?.id;
    
    console.log(`🏷️ Generated labels mapping with ${createdLabels.length} labels`);
    if (mockLabelId) {
      console.log(`✓ Found mock label ID: ${mockLabelId}`);
    } else {
      console.warn('⚠️ Mock label not found in created labels');
    }
    
    return { createdLabelsMap, mockLabelId };
  }
}