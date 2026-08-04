import CreateAttachment from "./create-attachment";
import DeleteAttachment from "./delete-attachment";
import GetUploadSignature from "./get-upload-signature";

const AttachmentMutationFields = {
  getUploadSignature: GetUploadSignature,
  createAttachment: CreateAttachment,
  deleteAttachment: DeleteAttachment,
};

export default AttachmentMutationFields;
