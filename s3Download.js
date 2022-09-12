// Used to download any objects from a prod bucket, given the file names or the urls

const AWS = require('aws-sdk');
const fs = require('fs');

AWSS3Utils = {};

AWSS3Utils.S3Object = new AWS.S3({
	accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || "<key here>",
	secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || "<key here>",
	signatureVersion: 'v4',
	region: 'ap-south-1'
});

AWSS3Utils.downloadObjectV2 = async (fileName, bucketName) => {
	try {
		let objectResponse = await new Promise((resolve, reject) => {
			AWSS3Utils.S3Object.getObject({
				Bucket: bucketName,
				Key: decodeURIComponent(fileName)
			}, (err, data) => {
				if (err) {
					console.error('ERROR: AWSS3Utils.downloadObjectV2 download to s3 failed with error: ', err);
					reject(err);
					return;
				}
				resolve(data);
				return;
			});
		});
		return objectResponse;
	} catch (err) {
		console.error("ERROR: AWSS3Utils.downloadObjectV2 file could not be downloaded with error: ", err);
		return;
	}
};

const downloadFileManually = async (bucketName, fileName, fileNameToWrite) => {
	let fileBuffer = await AWSS3Utils.downloadObjectV2(fileName, bucketName);
	console.log("Line 420:", fileBuffer);
	fs.writeFile(__dirname + fileNameToWrite, fileBuffer.Body, function (err) {
		if (err) {
			console.log(`ERROR: ${err}`);
			return;
		}
	});
}

/**
 *
 * @param {*} bucketName The bucket name from which to download files
 * @param {*} filesToDownload The array of file names to download
 */
const downloadFilesFromBucketName = (bucketName, filesToDownload) => {
	try {
		for (let fileName of filesToDownload) {
			let fileNameToWrite = `/downloaded-files/${fileName.replace(/\//g, ' ')}`;
			downloadFileManually(bucketName, fileName, fileNameToWrite);
		}
	} catch (err) {
		console.error('Something went wrong while trying to download files: ', err);
	}
}

const download = () => {
	const fileNames = JSON.parse(fs.readFileSync('./file-names-to-download.json', 'utf-8')).fileNames;
	downloadFilesFromBucketName('production-user-asset-documents', fileNames);
}

download();
