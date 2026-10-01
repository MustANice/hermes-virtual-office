import re

with open('/root/projects/hermes-virtual-office/src/engine/RobloxOffice3D.ts', 'r') as f:
    text = f.read()

# 1. Add imports at the top
imports_to_add = """import { AvatarMovementController } from './AvatarMovementController';
import {
  CHAIR_REGISTRY,
  AGENT_HOME_CHAIRS,
  findAvailableChair,
} from './ChairInteractionSystem';
import { OfficeDebugVisualizer } from './OfficeDebugVisualizer';
"""

if 'AvatarMovementController' not in text:
    text = text.replace(
        "import { findPathThroughDoors, Point2D } from './OfficeNavMesh';",
        "import { findPathThroughDoors, Point2D } from './OfficeNavMesh';\n" + imports_to_add
    )
    print("Added imports to RobloxOffice3D.ts")

# 2. Add controller property to RobloxAvatar3D
if 'public controller!: AvatarMovementController;' not in text:
    text = text.replace(
        "export class RobloxAvatar3D {\n  public id: string;",
        "export class RobloxAvatar3D {\n  public id: string;\n  public controller!: AvatarMovementController;"
    )
    print("Added controller property to RobloxAvatar3D")

with open('/root/projects/hermes-virtual-office/src/engine/RobloxOffice3D.ts', 'w') as f:
    f.write(text)

print("Step 1 done")
