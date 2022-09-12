#!/usr/bin/env node
// Used to download any objects from a prod bucket, given the file names or the urls

const AWS = require('aws-sdk');
const yargs = require('yargs/yargs');
const fs = require('fs');
const { demandOption } = require('yargs');

AWSS3Utils = {};

// Args Setup ---------------------------------------------------------------------------

const argv = yargs(process.argv.slice(2))
	.scriptName('s3Download')
	.usage("$0 [args]")
	.options({
		"bucket-name": {
			type: "string",
			describe: "The bucket name from which the files need to be downloaded.",
			demandOption: true
		},
		"access-key-id": {
			type: "string",
			describe: "The AWS S3 access key ID"
		},
		"secret-access-key": {
			type: "string",
			describe: "The AWS S3 secret access key"
		}
	})
	.help()
	.parseSync();

// S3 Object Definition -----------------------------------------------------------------

AWSS3Utils.S3Object = new AWS.S3({
	accessKeyId: argv.accessKeyId || "<key here>",
	secretAccessKey: argv.secretAccessKey || "<key here>",
	signatureVersion: 'v4',
	region: 'ap-south-1'
});

// Function Definitions -----------------------------------------------------------------

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
	downloadFilesFromBucketName(argv.bucketName, fileNames);
}

download();
