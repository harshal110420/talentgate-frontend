import { useAuth } from "../context/AuthContext";
import { useSelector } from "react-redux";

const ButtonWrapper = ({ subModule, permission, children }) => {
  const { user } = useAuth();
  const role = user?.role;
  const { loggedInUserPermissions: modules, loading } = useSelector(
    (state) => state.userPermission
  );
  // console.log("🧠 ButtonWrapper Debug:");
  // console.log("User Role:", role);
  // console.log("Modules:", modules);
  // console.log("Checking SubModule & Permission:", { subModule, permission });

  if (!Array.isArray(modules) || !subModule || !permission) {
    // console.log("❌ Invalid props or permissions data");
    return null;
  }

  let matchedModule = null;
  let foundMenu = null;
  let actions = [];

  for (const mod of modules) {
    for (const type of ["Master", "Transaction", "Report"]) {
      const menuList = mod.menus?.[type] || [];
      const match = menuList.find(
        (menu) => menu.name === subModule || menu.menuId === subModule
      );
      if (match) {
        matchedModule = mod.moduleName || mod.modulePath;
        foundMenu = match;
        actions = match.actions || [];
        break;
      }
    }
    if (foundMenu) break;
  }

  if (!foundMenu) {
    // console.log("❌ SubModule not found in any module");
    return null;
  }

  const hasPermission = actions.includes(permission);

  // console.log(`✅ Matched Module: ${matchedModule}`);
  // console.log("🛠️ Menu Actions:", actions);
  // console.log("🔐 Has Permission:", hasPermission);

  if (!hasPermission) return null;

  return <>{children}</>;
};

export default ButtonWrapper;
