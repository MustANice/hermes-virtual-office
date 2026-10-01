with open('/root/projects/hermes-virtual-office/scripts/test_movement_and_collision.cjs', 'r') as f:
    text = f.read()

target = """        results.test5_sitting_lifecycle_30_cycles.passed = (completedCycles === 30) && (invalidTransitions === 0);
        results.test5_sitting_lifecycle_30_cycles.details = `Executed ${completedCycles}/30 full sit-work-stand-exit cycles across multiple chair orientations. Invalid transitions: ${invalidTransitions}`;
      } catch (err) {
        results.test5_sitting_lifecycle_30_cycles.details = err.message;
      }"""

replacement = """        results.test5_sitting_lifecycle_30_cycles.passed = (completedCycles === 30) && (invalidTransitions === 0);
        results.test5_sitting_lifecycle_30_cycles.details = `Executed ${completedCycles}/30 full sit-work-stand-exit cycles across multiple chair orientations. Invalid transitions: ${invalidTransitions}`;

        // Restore Orion to his home desk chair
        const homeChair = chairRegistry.get('exec_chair_orion');
        if (homeChair) {
          orionAvatar.controller.assignedChair = homeChair;
          orionAvatar.controller.phase = 'SEATED_IDLE';
          orionAvatar.controller.x = homeChair.seatAnchor.x;
          orionAvatar.controller.z = homeChair.seatAnchor.z;
          orionAvatar.controller.rotationY = homeChair.facingAngle;
          orionAvatar.controller.sitProgress = 1.0;
        }
      } catch (err) {
        results.test5_sitting_lifecycle_30_cycles.details = err.message;
      }"""

if target in text:
    text = text.replace(target, replacement)
    print("Added Orion restoration to Test 5")

with open('/root/projects/hermes-virtual-office/scripts/test_movement_and_collision.cjs', 'w') as f:
    f.write(text)

print("test script patched")
