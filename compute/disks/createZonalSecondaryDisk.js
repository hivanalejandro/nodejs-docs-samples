/*
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

async function main(
  secondaryDiskName,
  secondaryLocation,
  primaryDiskName,
  primaryLocation
) {
  // [START compute_disk_create_secondary]
  // Import the Compute library
  const computeLib = require('@google-cloud/compute');
  const compute = computeLib.protos.google.cloud.compute.v1;

  // Instantiate a diskClient
  const disksClient = new computeLib.DisksClient();
  // Instantiate a zoneOperationsClient
  const zoneOperationsClient = new computeLib.ZoneOperationsClient();

  /**
   * TODO(developer): Update/uncomment these variables before running the sample.
   */
  // The project for the secondary disk.
  const secondaryProjectId = await disksClient.getProjectId();

  // The zone for the secondary disk. The primary and secondary disks must be in different regions.
  // secondaryLocation = 'us-central1-a';

  // The name of the secondary disk.
  // secondaryDiskName = 'secondary-disk-name';

  // The project that contains the primary disk.
  const primaryProjectId = await disksClient.getProjectId();

  // The zone for the primary disk.
  // primaryLocation = 'us-central1-b';

  // The name of the primary disk that the secondary disk receives data from.
  // primaryDiskName = 'primary-disk-name';

  // The disk type. Must be one of `pd-ssd` or `pd-balanced`.
  const diskType = `zones/${secondaryLocation}/diskTypes/pd-balanced`;

  // The size of the secondary disk in gigabytes.
  const diskSizeGb = 10;

  // Create a secondary disk identical to the primary disk.
  async function callCreateComputeSecondaryDisk() {
    // Create a secondary disk
    const disk = new compute.Disk({
      sizeGb: diskSizeGb,
      name: secondaryDiskName,
      zone: secondaryLocation,
      type: diskType,
      asyncPrimaryDisk: new compute.DiskAsyncReplication({
        // Make sure that the primary disk supports asynchronous replication.
        // Only certain persistent disk types, like `pd-balanced` and `pd-ssd`, are eligible.
        disk: `projects/${primaryProjectId}/zones/${primaryLocation}/disks/${primaryDiskName}`,
      }),
    });

    const [response] = await disksClient.insert({
      project: secondaryProjectId,
      zone: secondaryLocation,
      diskResource: disk,
    });

    let operation = response.latestResponse;

    // Wait for the create secondary disk operation to complete.
    while (operation.status !== 'DONE') {
      [operation] = await zoneOperationsClient.wait({
        operation: operation.name,
        project: secondaryProjectId,
        zone: operation.zone.split('/').pop(),
      });
    }

    console.log(`Secondary disk: ${secondaryDiskName} created.`);
  }

  await callCreateComputeSecondaryDisk();
  // [END compute_disk_create_secondary]
}

main(...process.argv.slice(2)).catch(err => {
  console.error(err);
  process.exitCode = 1;
});