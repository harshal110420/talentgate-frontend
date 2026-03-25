import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import SkeletonForm from "../../../components/skeletons/skeletonForm";
import FormActionButtons from "../../../components/common/FormActionButtons";
import { getModulePathByMenu } from "../../../utils/navigation";

import {
    createJobOpening,
    updateJobOpening,
    fetchJobOpeningsById,
} from "../../../features/HR_Slices/jobOpening/jobOpeningSlice";

import { fetchAllDepartments } from "../../../features/department/departmentSlice";

const initialFormData = {
    jobCode: "",
    title: "",
    departmentId: "",
    designation: "",
    status: "Open",
    isPublished: true,
};

const JobOpeningForm = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { id } = useParams();
    const isEditMode = Boolean(id);

    const { loading, selectedJob } = useSelector((state) => state.jobOpening);
    const { list: departments = [] } = useSelector((state) => state.department);
    const modules = useSelector((state) => state.modules.list);
    const menus = useSelector((state) => state.menus.list);
    const modulePath = getModulePathByMenu("job_management", modules, menus);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    const [initialValues, setInitialValues] = useState(initialFormData);

    useEffect(() => {
        dispatch(fetchAllDepartments());
        if (id) dispatch(fetchJobOpeningsById(id));
    }, [dispatch, id]);

    useEffect(() => {
        if (isEditMode && selectedJob) {
            const loadedData = {
                jobCode: selectedJob.jobCode || "",
                title: selectedJob.title || "",
                departmentId: String(selectedJob.departmentId || ""),
                designation: selectedJob.designation || "",
                status: selectedJob.status || "Open",
                isPublished: selectedJob.isPublished ?? true,
            };
            setFormData(loadedData);
            setInitialValues(loadedData);
        }
    }, [selectedJob, isEditMode]);

    const hasChanges = () => {
        return Object.keys(formData).some(
            (key) => formData[key] !== initialValues[key]
        );
    };

    const isFormValid = () => {
        const requiredFilled =
            formData.title && formData.departmentId && formData.designation;
        return requiredFilled && (!isEditMode || hasChanges());
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        const payload = {
            title: formData.title,
            departmentId: Number(formData.departmentId),
            designation: formData.designation,
            status: formData.status,
            isPublished: formData.isPublished,
        };

        try {
            const action = isEditMode ? updateJobOpening : createJobOpening;
            const data = isEditMode ? { id, data: payload } : payload;

            await dispatch(action(data)).unwrap();
            toast.success(`Job ${isEditMode ? "updated" : "created"} successfully`);
            navigate(`/module/${modulePath}/job_management`);
        } catch (err) {
            toast.error(err || "Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <SkeletonForm />;

    return (
        <div className="flex flex-col h-full">
            <form
                onSubmit={handleSubmit}
                className="flex flex-col flex-grow max-w-full pt-5 pr-5 pl-5 pb-2 bg-white dark:bg-gray-900 rounded-lg shadow-md"
                noValidate
            >
                <h2 className="text-2xl font-semibold border-b pb-3 mb-6">
                    {isEditMode ? "Edit Job" : "Create Job"}
                </h2>

                <div className="flex-grow overflow-auto">
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Job Code */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Job Code</label>
                            <input
                                name="jobCode"
                                value={isEditMode ? formData.jobCode : "Auto Generated"}
                                disabled
                                className="w-full rounded-md border px-2 py-1 text-sm bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                            />
                        </div>

                        {/* Job Title */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Job Title *</label>
                            <input
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Frontend Developer"
                                className="w-full rounded-md border px-2 py-1 text-sm dark:bg-gray-900"
                            />
                        </div>

                        {/* Department */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Department *</label>
                            <select
                                name="departmentId"
                                value={formData.departmentId}
                                onChange={handleChange}
                                required
                                className="w-full rounded-md border px-2 py-1 text-sm dark:bg-gray-900"
                            >
                                <option value="">Select</option>
                                {departments.map((d) => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Designation */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Designation *</label>
                            <input
                                name="designation"
                                value={formData.designation}
                                onChange={handleChange}
                                required
                                className="w-full rounded-md border px-2 py-1 text-sm dark:bg-gray-900"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Status *</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full rounded-md border px-2 py-1 text-sm dark:bg-gray-900"
                            >
                                <option value="Draft">Draft</option>
                                <option value="Open">Open</option>
                                <option value="Hold">Hold</option>
                                <option value="Closed">Closed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>

                        {/* Publish */}
                        <div className="flex items-center mt-6">
                            <input
                                type="checkbox"
                                id="isPublished"
                                name="isPublished"
                                checked={formData.isPublished}
                                onChange={handleChange}
                                className="w-5 h-5"
                            />
                            <label htmlFor="isPublished" className="text-sm ml-2">Publish?</label>
                        </div>

                    </section>
                </div>

                <FormActionButtons
                    loading={loading}
                    isSubmitting={isSubmitting}
                    isEditMode={isEditMode}
                    currentStep={0}
                    totalSteps={1}
                    isLastStep={true}
                    isFormValid={isFormValid()}
                    hideSubmit={false}
                    onPrevious={() => { }}
                    onNext={() => { }}
                    onSubmitClick={() => { }}
                />
            </form>
        </div>
    );
};

export default JobOpeningForm;