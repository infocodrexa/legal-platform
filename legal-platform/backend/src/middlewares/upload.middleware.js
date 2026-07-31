// const multer = require("multer");
// const path = require("path");
// const { ApiError } = require("../utils/apiResponse");

// /**
//  * Multer memory storage
//  *
//  * File disk par save nahi hogi.
//  * File req.file.buffer / req.files me milegi
//  * aur wahi buffer Supabase Storage me upload hoga.
//  */
// const storage = multer.memoryStorage();

// /**
//  * General allowed MIME types.
//  */
// const DOCUMENT_MIME_TYPES = new Set([
//   "application/pdf",
//   "image/jpeg",
//   "image/png",
//   "image/webp",
// ]);

// const IMAGE_MIME_TYPES = new Set([
//   "image/jpeg",
//   "image/png",
//   "image/webp",
// ]);

// const ATTACHMENT_MIME_TYPES = new Set([
//   "application/pdf",
//   "image/jpeg",
//   "image/png",
//   "image/webp",
//   "application/msword",
//   "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
// ]);

// const ALLOWED_EXTENSIONS = new Set([
//   ".pdf",
//   ".jpg",
//   ".jpeg",
//   ".png",
//   ".webp",
//   ".doc",
//   ".docx",
// ]);

// /**
//  * File name se unsafe characters remove karta hai.
//  */
// function sanitizeOriginalFileName(fileName = "file") {
//   const extension = path.extname(fileName).toLowerCase();
//   const baseName = path.basename(fileName, extension);

//   const safeBaseName = baseName
//     .normalize("NFKD")
//     .replace(/[^a-zA-Z0-9._-]/g, "-")
//     .replace(/-+/g, "-")
//     .replace(/^-+|-+$/g, "");

//   return `${safeBaseName || "file"}${extension}`;
// }

// /**
//  * MIME type aur extension dono validate karta hai.
//  */
// function validateFile({
//   file,
//   allowedMimeTypes,
//   allowedExtensions = ALLOWED_EXTENSIONS,
// }) {
//   const extension = path
//     .extname(file.originalname || "")
//     .toLowerCase();

//   if (!allowedMimeTypes.has(file.mimetype)) {
//     throw new ApiError(
//       400,
//       `Unsupported file type: ${file.mimetype}`
//     );
//   }

//   if (!allowedExtensions.has(extension)) {
//     throw new ApiError(
//       400,
//       `Unsupported file extension: ${extension || "unknown"}`
//     );
//   }

//   file.originalname = sanitizeOriginalFileName(
//     file.originalname
//   );
// }

// /**
//  * Main multer factory.
//  */
// function createUploader({
//   allowedMimeTypes,
//   maxFileSize,
// }) {
//   return multer({
//     storage,

//     limits: {
//       fileSize: maxFileSize,
//       files: 10,
//       fields: 50,
//     },

//     fileFilter: (_req, file, callback) => {
//       try {
//         validateFile({
//           file,
//           allowedMimeTypes,
//         });

//         callback(null, true);
//       } catch (error) {
//         callback(error);
//       }
//     },
//   });
// }

// /**
//  * Single document uploader
//  *
//  * Form-data field:
//  * file
//  *
//  * Allowed:
//  * PDF, JPG, JPEG, PNG, WebP
//  *
//  * Maximum:
//  * 10 MB
//  */
// const documentUploader = createUploader({
//   allowedMimeTypes: DOCUMENT_MIME_TYPES,
//   maxFileSize: 10 * 1024 * 1024,
// });

// const uploadSingleDocument =
//   documentUploader.single("file");

// /**
//  * Lawyer KYC uploader
//  *
//  * Supported form-data fields:
//  *
//  * profilePhoto
//  * aadhaar
//  * pan
//  * barCouncilCertificate
//  * enrollmentCertificate
//  * addressProof
//  *
//  * Change these names only if your frontend sends
//  * different multipart/form-data field names.
//  */
// const kycUploader = createUploader({
//   allowedMimeTypes: DOCUMENT_MIME_TYPES,
//   maxFileSize: 10 * 1024 * 1024,
// });

// const uploadKycDocs = kycUploader.fields([
//   {
//     name: "profilePhoto",
//     maxCount: 1,
//   },
//   {
//     name: "aadhaar",
//     maxCount: 1,
//   },
//   {
//     name: "pan",
//     maxCount: 1,
//   },
//   {
//     name: "barCouncilCertificate",
//     maxCount: 1,
//   },
//   {
//     name: "enrollmentCertificate",
//     maxCount: 1,
//   },
//   {
//     name: "addressProof",
//     maxCount: 1,
//   },
// ]);

// /**
//  * Single profile-image uploader
//  *
//  * Form-data field:
//  * profilePhoto
//  *
//  * Maximum:
//  * 5 MB
//  */
// const imageUploader = createUploader({
//   allowedMimeTypes: IMAGE_MIME_TYPES,
//   maxFileSize: 5 * 1024 * 1024,
// });

// const uploadProfilePhoto =
//   imageUploader.single("profilePhoto");

// /**
//  * Appointment/case attachment uploader
//  *
//  * Form-data field:
//  * attachments
//  *
//  * Maximum files:
//  * 5
//  *
//  * Maximum size per file:
//  * 10 MB
//  */
// const attachmentUploader = createUploader({
//   allowedMimeTypes: ATTACHMENT_MIME_TYPES,
//   maxFileSize: 10 * 1024 * 1024,
// });

// const uploadCaseAttachments =
//   attachmentUploader.array("attachments", 5);

// /**
//  * Express error-handling middleware for Multer.
//  *
//  * Isko routes ke baad aur global error handler
//  * se pehle app.js/server.js me register karo.
//  */
// function handleUploadError(error, _req, _res, next) {
//   if (error instanceof multer.MulterError) {
//     switch (error.code) {
//       case "LIMIT_FILE_SIZE":
//         return next(
//           new ApiError(
//             413,
//             "Uploaded file exceeds the allowed size limit"
//           )
//         );

//       case "LIMIT_FILE_COUNT":
//         return next(
//           new ApiError(
//             400,
//             "Too many files were uploaded"
//           )
//         );

//       case "LIMIT_UNEXPECTED_FILE":
//         return next(
//           new ApiError(
//             400,
//             `Unexpected file field: ${error.field}`
//           )
//         );

//       case "LIMIT_FIELD_COUNT":
//         return next(
//           new ApiError(
//             400,
//             "Too many form fields were submitted"
//           )
//         );

//       default:
//         return next(
//           new ApiError(
//             400,
//             error.message || "File upload failed"
//           )
//         );
//     }
//   }

//   return next(error);
// }


// const uploadBlogCoverImage =
//   imageUploader.single("coverImage");




// module.exports = {
//   uploadSingleDocument,
//   uploadKycDocs,
//   uploadProfilePhoto,
//   uploadCaseAttachments,
//   uploadBlogCoverImage,
//   handleUploadError,
// };



const multer = require("multer");
const path = require("path");
const { ApiError } = require("../utils/apiResponse");

const storage = multer.memoryStorage();

const DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ATTACHMENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".doc",
  ".docx",
]);

function sanitizeOriginalFileName(fileName = "file") {
  const extension = path.extname(fileName).toLowerCase();
  const baseName = path.basename(fileName, extension);

  const safeBaseName = baseName
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${safeBaseName || "file"}${extension}`;
}

function validateFile({
  file,
  allowedMimeTypes,
  allowedExtensions = ALLOWED_EXTENSIONS,
}) {
  const extension = path
    .extname(file.originalname || "")
    .toLowerCase();

  if (!allowedMimeTypes.has(file.mimetype)) {
    throw new ApiError(
      400,
      `Unsupported file type: ${file.mimetype}`
    );
  }

  if (!allowedExtensions.has(extension)) {
    throw new ApiError(
      400,
      `Unsupported file extension: ${extension || "unknown"}`
    );
  }

  file.originalname = sanitizeOriginalFileName(
    file.originalname
  );
}

function createUploader({
  allowedMimeTypes = ATTACHMENT_MIME_TYPES,
  maxFileSize = 10 * 1024 * 1024,
  maxFiles = 10,
}) {
  return multer({
    storage,

    limits: {
      fileSize: maxFileSize,
      files: maxFiles,
      fields: 50,
    },

    fileFilter: (_req, file, callback) => {
      try {
        validateFile({
          file,
          allowedMimeTypes,
        });

        callback(null, true);
      } catch (error) {
        callback(error);
      }
    },
  });
}

/**
 * Generic backward-compatible multer instance.
 *
 * Purana code:
 * upload.single("file")
 * upload.single("coverImage")
 * upload.array("attachments", 5)
 * upload.fields([...])
 *
 * Sab kaam karega.
 */
const upload = createUploader({
  allowedMimeTypes: ATTACHMENT_MIME_TYPES,
  maxFileSize: 10 * 1024 * 1024,
  maxFiles: 10,
});

/**
 * Dedicated upload middlewares.
 */

const documentUploader = createUploader({
  allowedMimeTypes: DOCUMENT_MIME_TYPES,
  maxFileSize: 10 * 1024 * 1024,
  maxFiles: 1,
});

const uploadSingleDocument =
  documentUploader.single("file");

const kycUploader = createUploader({
  allowedMimeTypes: DOCUMENT_MIME_TYPES,
  maxFileSize: 10 * 1024 * 1024,
  maxFiles: 6,
});

const uploadKycDocs = kycUploader.fields([
  {
    name: "profilePhoto",
    maxCount: 1,
  },
  {
    name: "aadhaar",
    maxCount: 1,
  },
  {
    name: "pan",
    maxCount: 1,
  },
  {
    name: "barCouncilCertificate",
    maxCount: 1,
  },
  {
    name: "enrollmentCertificate",
    maxCount: 1,
  },
  {
    name: "addressProof",
    maxCount: 1,
  },
]);

const imageUploader = createUploader({
  allowedMimeTypes: IMAGE_MIME_TYPES,
  maxFileSize: 5 * 1024 * 1024,
  maxFiles: 1,
});

const uploadProfilePhoto =
  imageUploader.single("profilePhoto");

const uploadBlogCoverImage =
  imageUploader.single("coverImage");

const attachmentUploader = createUploader({
  allowedMimeTypes: ATTACHMENT_MIME_TYPES,
  maxFileSize: 10 * 1024 * 1024,
  maxFiles: 5,
});

const uploadCaseAttachments =
  attachmentUploader.array("attachments", 5);

const uploadChatAttachment =
  attachmentUploader.single("file");

function handleUploadError(error, _req, _res, next) {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        return next(
          new ApiError(
            413,
            "Uploaded file exceeds the allowed size limit"
          )
        );

      case "LIMIT_FILE_COUNT":
        return next(
          new ApiError(
            400,
            "Too many files were uploaded"
          )
        );

      case "LIMIT_UNEXPECTED_FILE":
        return next(
          new ApiError(
            400,
            `Unexpected file field: ${error.field}`
          )
        );

      case "LIMIT_FIELD_COUNT":
        return next(
          new ApiError(
            400,
            "Too many form fields were submitted"
          )
        );

      default:
        return next(
          new ApiError(
            400,
            error.message || "File upload failed"
          )
        );
    }
  }

  return next(error);
}

/**
 * Important:
 *
 * module.exports ko multer instance hi rakha gaya hai,
 * isliye purana code upload.single(...) chalega.
 *
 * Saath me named properties attach ki gayi hain,
 * isliye destructuring imports bhi chalenge.
 */

upload.uploadSingleDocument = uploadSingleDocument;
upload.uploadKycDocs = uploadKycDocs;
upload.uploadProfilePhoto = uploadProfilePhoto;
upload.uploadBlogCoverImage = uploadBlogCoverImage;
upload.uploadCaseAttachments = uploadCaseAttachments;
upload.uploadChatAttachment = uploadChatAttachment;
upload.handleUploadError = handleUploadError;

module.exports = upload;