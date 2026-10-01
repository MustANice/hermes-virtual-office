with open('/root/projects/hermes-virtual-office/src/engine/RobloxOffice3D.ts', 'r') as f:
    content = f.read()

start_marker = "  private buildTerracedAtelier() {"
end_marker = "  private createCodeSyntaxTexture("

start_pos = content.find(start_marker)
end_pos = content.find(end_marker)

if start_pos != -1 and end_pos != -1:
    replacement = """  public floorPlan?: OfficeFloorPlan;

  private buildOfficeLayout() {
    this.floorPlan = createOfficeFloorPlan({
      shadows: true,
      addLights: false,
      spawnAvatars: false, // Avatars are managed dynamically by RobloxOffice3D!
    });
    this.scene.add(this.floorPlan.group);
  }

"""
    new_content = content[:start_pos] + replacement + content[end_pos:]
    with open('/root/projects/hermes-virtual-office/src/engine/RobloxOffice3D.ts', 'w') as f:
        f.write(new_content)
    print("SUCCESS: replaced old buildTerracedAtelier with buildOfficeLayout!")
else:
    print(f"FAILED: start_pos={start_pos}, end_pos={end_pos}")
