import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import SkeletonForm from "../../../components/skeletons/skeletonForm";
import { getModulePathByMenu } from "../../../utils/navigation";
import { fetchJobOpeningsById } from "../../../features/HR_Slices/jobOpening/jobOpeningSlice";
import { fetchAllDepartments } from "../../../features/department/departmentSlice";
import { ViewField } from "../../../components/common/ViewField";
import FormActionButtons from "../../../components/common/FormActionButtons";

const JobDetails = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();

    const { loading, selectedJob } = useSelector((state) => state.jobOpening);
    const { list: departments = [] } = useSelector((state) => state.department);
    const modules = useSelector((state) => state.modules.list);
    const menus = useSelector((state) => state.menus.list);
    const modulePath = getModulePathByMenu("job_management", modules, menus);

    useEffect(() => {
        dispatch(fetchAllDepartments());
        if (id) dispatch(fetchJobOpeningsById(id));
    }, [id, dispatch]);

    if (loading || !selectedJob) return <SkeletonForm />;

    const getDepartmentName = () => {
        const dept = departments.find((d) => d.id === selectedJob.departmentId);
        return dept?.name || "—";
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case "Open": return "bg-green-100 text-green-700";
            case "Draft": return "bg-gray-100 text-gray-700";
            case "Hold": return "bg-yellow-100 text-yellow-700";
            case "Closed": return "bg-blue-100 text-blue-700";
            case "Cancelled": return "bg-red-100 text-red-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-col flex-grow max-w-full pt-5 pr-5 pl-5 pb-2 bg-white dark:bg-gray-900 rounded-lg shadow-md">

                <h2 className="text-2xl font-semibold border-b pb-3 mb-6">Job Details</h2>

                <div className="flex-grow overflow-auto">
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        <ViewField label="Job Code" value={selectedJob.jobCode} />
                        <ViewField label="Job Title" value={selectedJob.title} />
                        <ViewField label="Department" value={getDepartmentName()} />
                        <ViewField label="Designation" value={selectedJob.designation} />

                        {/* Status badge */}
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Status</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(selectedJob.status)}`}>
                                {selectedJob.status}
                            </span>
                        </div>

                        {/* Published badge */}
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Visibility</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selectedJob.isPublished ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                }`}>
                                {selectedJob.isPublished ? "Published" : "Unpublished"}
                            </span>
                        </div>

                    </section>
                </div>

                <FormActionButtons
                    currentStep={0}
                    totalSteps={1}
                    isLastStep={true}
                    onBackClick={() => navigate(`/module/${modulePath}/job_management`)}
                    onPrevious={() => { }}
                    onNext={() => { }}
                    hideSubmit={true}
                    loading={false}
                />
            </div>
        </div>
    );
};

export default JobDetails;