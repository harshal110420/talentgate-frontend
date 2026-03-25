import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createUser,
  updateUser,
  getUserById,
} from "../../../features/users/userSlice";
import { fetchAllRoles } from "../../../features/Roles/rolesSlice";
import { fetchAllDepartments } from "../../../features/department/departmentSlice";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  User, Mail, Lock, Phone, Building2, Shield,
  ArrowLeft, Save, Loader2, UserPlus, UserCog, AlertCircle,
  StepBack,
} from "lucide-react";
import { getModulePathByMenu } from "../../../utils/navigation";
import SkeletonForm from "../../../components/skeletons/skeletonForm";
import FormActionButtons from "../../../components/common/FormActionButtons";

const initialFormData = {
  mail: "", username: "", firstName: "", lastName: "",
  password: "", roleId: "", mobile: "", departmentId: "", isActive: true,
};

const steps = ["Basic Info"];

/* ── Avatar preview ───────────────────────────────────────────── */
const AvatarPreview = ({ firstName, lastName, username }) => {
  const initials =
    firstName && lastName
      ? `${firstName[0]}${lastName[0]}`.toUpperCase()
      : username ? username.slice(0, 2).toUpperCase() : "??";
  return (
    <div className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center
                    text-white text-lg font-bold shadow-md shadow-blue-200 dark:shadow-blue-900/40
                    bg-gradient-to-br from-blue-500 to-indigo-600">
      {initials}
    </div>
  );
};

/* ── Field Label ─────────────────────────────────────────────── */
const FieldLabel = ({ htmlFor, children, required }) => (
  <label htmlFor={htmlFor}
    className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
    {children}{required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

/* ── Input field ─────────────────────────────────────────────── */
const InputField = ({ icon: Icon, id, name, type = "text", value, onChange, placeholder, disabled, hint }) => (
  <div>
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
          <Icon size={14} />
        </div>
      )}
      <input
        type={type} id={id} name={name} value={value}
        onChange={onChange} placeholder={placeholder} disabled={disabled}
        className={`
          block w-full rounded-xl border px-3 py-2.5 text-sm
          text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400
          dark:focus:border-blue-500 transition-all duration-150
          ${Icon ? "pl-9" : ""}
          ${disabled
            ? "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border-dashed"
            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          }
        `}
      />
    </div>
    {hint && (
      <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
        <AlertCircle size={10} /> {hint}
      </p>
    )}
  </div>
);

/* ── Select field ────────────────────────────────────────────── */
const SelectField = ({ icon: Icon, id, name, value, onChange, children }) => (
  <div className="relative">
    {Icon && (
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none z-10">
        <Icon size={14} />
      </div>
    )}
    <select id={id} name={name} value={value} onChange={onChange}
      className={`
        block w-full rounded-xl border px-3 py-2.5 text-sm appearance-none cursor-pointer
        text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800
        border-gray-200 dark:border-gray-700
        focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400
        dark:focus:border-blue-500 transition-all duration-150
        ${Icon ? "pl-9" : ""}
      `}
    >
      {children}
    </select>
    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M6 8L1 3h10L6 8z" /></svg>
    </div>
  </div>
);

/* ── Main Component ───────────────────────────────────────────── */
const UserForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState(initialFormData);
  const [initialValues, setInitialValues] = useState(initialFormData);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modules = useSelector((s) => s.modules.list);
  const menus = useSelector((s) => s.menus.list);
  const modulePath = getModulePathByMenu("user_management", modules, menus);
  const { roles, loading: rolesLoading } = useSelector((s) => s.roles);
  const departmentList = useSelector((s) => s.department.list);
  const deptLoading = useSelector((s) => s.department.loading);
  const { selectedUser, loading: userLoading } = useSelector((s) => s.users);

  useEffect(() => {
    dispatch(fetchAllRoles());
    dispatch(fetchAllDepartments());
    if (id) dispatch(getUserById(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (isEditMode && selectedUser && Object.keys(selectedUser).length > 0) {
      const loadedData = {
        mail: selectedUser.mail || "",
        username: selectedUser.username || "",
        firstName: selectedUser.firstName || "",
        lastName: selectedUser.lastName || "",
        password: "",
        mobile: selectedUser.mobile || "",
        roleId: selectedUser.roleId?.toString() || "",
        departmentId: selectedUser.departmentId?.toString() || "",
        isActive: selectedUser.isActive ?? true,
      };
      setFormData(loadedData);
      setInitialValues(loadedData);
    }
  }, [isEditMode, selectedUser]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const hasChanges = () =>
    Object.keys(formData).some((key) => {
      if (Array.isArray(formData[key]))
        return JSON.stringify(formData[key]) !== JSON.stringify(initialValues[key]);
      return formData[key] !== initialValues[key];
    });

  const isFormValid = () => {
    const requiredFilled =
      formData.mail.trim() !== "" && formData.username.trim() !== "" &&
      formData.firstName.trim() !== "" && formData.lastName.trim() !== "" &&
      formData.roleId.trim() !== "" && formData.departmentId.trim() !== "" &&
      (isEditMode || formData.password.trim() !== "") && formData.mobile.trim() !== "";
    return requiredFilled && (!isEditMode || hasChanges());
  };

  const getChangedFields = () => {
    const changedFields = {};
    Object.keys(formData).forEach((key) => {
      if (key === "username") return;
      if (isEditMode && key === "password" && formData[key].trim() === "") return;
      if (formData[key] !== initialValues[key]) changedFields[key] = formData[key];
    });
    return changedFields;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    let dataToSend;
    if (isEditMode) {
      const changedFields = getChangedFields();
      if (!Object.keys(changedFields).length) {
        toast.info("No changes detected to update");
        setIsSubmitting(false);
        return;
      }
      dataToSend = { ...changedFields, id };
    } else {
      dataToSend = { ...formData };
    }

    try {
      await dispatch((isEditMode ? updateUser : createUser)(dataToSend)).unwrap();
      toast.success(`User ${isEditMode ? "updated" : "created"} successfully`);
      navigate(`/module/${modulePath}/user_management`);
    } catch (err) {
      toast.error(typeof err === "string" ? err : err?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = rolesLoading || deptLoading || (isEditMode && userLoading);
  if (isLoading) return <SkeletonForm />;

  const selectedRole = roles.find((r) => r.id.toString() === formData.roleId);
  const selectedDept = departmentList.find((d) => d.id.toString() === formData.departmentId);

  return (
    <div className="max-w-full px-5 py-6 font-sans text-gray-800 dark:text-gray-100">
      <form onSubmit={handleSubmit} noValidate>

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">

          {/* Left: name + live-update badges */}
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-tight">
                {isEditMode
                  ? (formData.firstName || formData.lastName
                    ? `${formData.firstName} ${formData.lastName}`.trim()
                    : "Edit User")
                  : "Create New User"
                }
              </h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                  {isEditMode ? <UserCog size={11} /> : <UserPlus size={11} />}
                  {isEditMode ? "Editing user profile" : "Fill in the details below"}
                </span>

                {selectedRole && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold
                                   bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300
                                   border border-indigo-200 dark:border-indigo-800">
                    {selectedRole.displayName}
                  </span>
                )}
                {selectedDept && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold
                                   bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300
                                   border border-slate-200 dark:border-slate-700">
                    {selectedDept.name}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border
                  ${formData.isActive
                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                    : "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${formData.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                  {formData.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Back + Save — same as UsersPage "Add User" button style */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => navigate(`/module/${modulePath}/user_management`)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all shadow-sm hover:shadow-md"
            >
              <StepBack size={14} /> Back
            </button>
          </div>
        </div>

        {/* ── Form Card ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">

          {/* Card section header */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
                <User size={12} color="white" />
              </div>
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Basic Information</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 ml-8">
              Fields marked <span className="text-red-400">*</span> are required
            </p>
          </div>

          {/* Fields grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">

              <div>
                <FieldLabel htmlFor="username" required={!isEditMode}>Username</FieldLabel>
                <InputField
                  icon={User} id="username" name="username"
                  value={formData.username} onChange={handleChange}
                  placeholder="e.g. john.doe" disabled={isEditMode}
                  hint={isEditMode ? "Cannot be changed after creation" : undefined}
                />
              </div>

              <div>
                <FieldLabel htmlFor="firstName" required>First Name</FieldLabel>
                <InputField
                  icon={User} id="firstName" name="firstName"
                  value={formData.firstName} onChange={handleChange}
                  placeholder="e.g. John"
                />
              </div>

              <div>
                <FieldLabel htmlFor="lastName" required>Last Name</FieldLabel>
                <InputField
                  icon={User} id="lastName" name="lastName"
                  value={formData.lastName} onChange={handleChange}
                  placeholder="e.g. Doe"
                />
              </div>

              <div>
                <FieldLabel htmlFor="mail" required>Email Address</FieldLabel>
                <InputField
                  icon={Mail} id="mail" name="mail" type="email"
                  value={formData.mail} onChange={handleChange}
                  placeholder="e.g. john@company.com"
                />
              </div>

              <div>
                <FieldLabel htmlFor="password" required={!isEditMode}>
                  Password{" "}
                  {isEditMode && (
                    <span className="normal-case font-normal text-gray-400 dark:text-gray-500 ml-1">
                      (leave blank to keep)
                    </span>
                  )}
                </FieldLabel>
                <InputField
                  icon={Lock} id="password" name="password" type="password"
                  value={formData.password} onChange={handleChange}
                  placeholder={isEditMode ? "Leave blank to keep current" : "Min. 8 characters"}
                />
              </div>

              <div>
                <FieldLabel htmlFor="mobile" required>Mobile</FieldLabel>
                <InputField
                  icon={Phone} id="mobile" name="mobile"
                  value={formData.mobile} onChange={handleChange}
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div>
                <FieldLabel htmlFor="departmentId" required>Department</FieldLabel>
                <SelectField icon={Building2} id="departmentId" name="departmentId" value={formData.departmentId} onChange={handleChange}>
                  <option value="">Select Department</option>
                  {departmentList.map((dep) => (
                    <option key={dep.id} value={dep.id.toString()}>{dep.name}</option>
                  ))}
                </SelectField>
              </div>

              <div>
                <FieldLabel htmlFor="roleId" required>Role</FieldLabel>
                <SelectField icon={Shield} id="roleId" name="roleId" value={formData.roleId} onChange={handleChange}>
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id.toString()}>{role.displayName}</option>
                  ))}
                </SelectField>
              </div>

              {/* Active toggle card */}
              <div className="flex items-end">
                <label htmlFor="isActive"
                  className={`
                    flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 cursor-pointer
                    transition-all duration-200
                    ${formData.isActive
                      ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/30"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60"
                    }
                  `}
                >
                  <div className={`relative w-10 h-5 rounded-full flex-shrink-0 transition-colors duration-200
                    ${formData.isActive ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
                      ${formData.isActive ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold leading-tight
                      ${formData.isActive ? "text-emerald-700 dark:text-emerald-300" : "text-gray-600 dark:text-gray-400"}`}>
                      {formData.isActive ? "Active User" : "Inactive User"}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                      {formData.isActive ? "User can log in" : "Login is disabled"}
                    </p>
                  </div>
                  <input type="checkbox" id="isActive" name="isActive"
                    checked={formData.isActive} onChange={handleChange} className="sr-only" />
                </label>
              </div>

            </div>
          </div>
        </div>

        {/* ── Bottom action buttons (existing component) ── */}
        <div className="flex flex-col justify-between items-end mt-5">
          <FormActionButtons
            loading={isLoading}
            isSubmitting={isSubmitting}
            isEditMode={isEditMode}
            currentStep={currentStep}
            totalSteps={steps.length}
            isLastStep={currentStep === steps.length - 1}
            isFormValid={isFormValid()}
            hideSubmit={false}
            onPrevious={() => setCurrentStep((p) => p - 1)}
            onNext={() => setCurrentStep((p) => p + 1)}
            onSubmitClick={() => { }}
          />
        </div>

      </form>
    </div>
  );
};

export default UserForm;