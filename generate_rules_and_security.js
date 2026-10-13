import fs from 'fs';
import path from 'path';

const baseDir = process.cwd();
function writeFile(relPath, content) {
    const fullPath = path.join(baseDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
    console.log(`Created: ${relPath}`);
}

// 1. Validation Rules
// Farm__c: Check_Area_Positive
const farmValXml = `<?xml version="1.0" encoding="UTF-8"?>
<ValidationRule xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Check_Area_Positive</fullName>
    <active>true</active>
    <description>Total farm area must be strictly positive.</description>
    <errorConditionFormula>Total_Area_Acres__c &lt;= 0</errorConditionFormula>
    <errorDisplayField>Total_Area_Acres__c</errorDisplayField>
    <errorMessage>Total farm area in acres must be greater than zero.</errorMessage>
</ValidationRule>`;
writeFile('force-app/main/default/objects/Farm__c/validationRules/Check_Area_Positive.validationRule-meta.xml', farmValXml);

// Farmer__c: Valid_Aadhaar_Length
const farmerValXml = `<?xml version="1.0" encoding="UTF-8"?>
<ValidationRule xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Valid_Aadhaar_Length</fullName>
    <active>true</active>
    <description>Aadhaar / National ID must be at least 12 digits.</description>
    <errorConditionFormula>LEN(Aadhaar_ID__c) &lt; 12</errorConditionFormula>
    <errorDisplayField>Aadhaar_ID__c</errorDisplayField>
    <errorMessage>National identification (Aadhaar ID) must be at least 12 characters long.</errorMessage>
</ValidationRule>`;
writeFile('force-app/main/default/objects/Farmer__c/validationRules/Valid_Aadhaar_Length.validationRule-meta.xml', farmerValXml);

// Crop_Production__c: Harvest_After_Sowing
const cropValXml = `<?xml version="1.0" encoding="UTF-8"?>
<ValidationRule xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Harvest_After_Sowing</fullName>
    <active>true</active>
    <description>Harvest date cannot be earlier than sowing date.</description>
    <errorConditionFormula>NOT(ISBLANK(Harvest_Date__c)) &amp;&amp; Harvest_Date__c &lt; Sowing_Date__c</errorConditionFormula>
    <errorDisplayField>Harvest_Date__c</errorDisplayField>
    <errorMessage>Harvest Date cannot precede the Sowing Date.</errorMessage>
</ValidationRule>`;
writeFile('force-app/main/default/objects/Crop_Production__c/validationRules/Harvest_After_Sowing.validationRule-meta.xml', cropValXml);

// Sales_Transaction__c: Amount_Paid_Not_Exceed_Total
const salesValXml = `<?xml version="1.0" encoding="UTF-8"?>
<ValidationRule xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Amount_Paid_Not_Exceed_Total</fullName>
    <active>true</active>
    <description>Amount paid cannot exceed total billable amount.</description>
    <errorConditionFormula>Amount_Paid__c &gt; Total_Amount__c</errorConditionFormula>
    <errorDisplayField>Amount_Paid__c</errorDisplayField>
    <errorMessage>Amount Paid cannot exceed the Total Invoice Amount.</errorMessage>
</ValidationRule>`;
writeFile('force-app/main/default/objects/Sales_Transaction__c/validationRules/Amount_Paid_Not_Exceed_Total.validationRule-meta.xml', salesValXml);

// 2. Custom Tabs
const tabs = [
    { name: 'Farm__c', motif: 'Custom40: Compass' },
    { name: 'Farmer__c', motif: 'Custom15: People' },
    { name: 'Crop_Production__c', motif: 'Custom5: Leaf' },
    { name: 'Buyer__c', motif: 'Custom68: Globe' },
    { name: 'Sales_Transaction__c', motif: 'Custom41: Cash' },
    { name: 'FMS_Dashboard', motif: 'Custom62: Chalkboard', lwc: 'fmsAppContainer' }
];

for (const tab of tabs) {
    if (tab.lwc) {
        const tabXml = `<?xml version="1.0" encoding="UTF-8"?>
<CustomTab xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>Farm Management Dashboard</label>
    <lwcComponent>${tab.lwc}</lwcComponent>
    <motif>${tab.motif}</motif>
</CustomTab>`;
        writeFile(`force-app/main/default/tabs/${tab.name}.tab-meta.xml`, tabXml);
    } else {
        const tabXml = `<?xml version="1.0" encoding="UTF-8"?>
<CustomTab xmlns="http://soap.sforce.com/2006/04/metadata">
    <customObject>true</customObject>
    <motif>${tab.motif}</motif>
</CustomTab>`;
        writeFile(`force-app/main/default/tabs/${tab.name}.tab-meta.xml`, tabXml);
    }
}

// 3. Custom Application
const appXml = `<?xml version="1.0" encoding="UTF-8"?>
<CustomApplication xmlns="http://soap.sforce.com/2006/04/metadata">
    <brand>
        <headerColor>#2E7D32</headerColor>
        <shouldOverrideOrgTheme>false</shouldOverrideOrgTheme>
    </brand>
    <description>Comprehensive Farm Management System (FMS) for managing farms, crop production cycles, registered farmers, procurement buyers, and financial transactions.</description>
    <formFactors>Small</formFactors>
    <formFactors>Large</formFactors>
    <isNavAutoUpdatePrerenderEnabled>false</isNavAutoUpdatePrerenderEnabled>
    <isNavPersonalizationDisabled>false</isNavPersonalizationDisabled>
    <isNavTabPersistenceDisabled>false</isNavTabPersistenceDisabled>
    <isOmniPinnedViewEnabled>false</isOmniPinnedViewEnabled>
    <label>Farm Management System</label>
    <navType>Standard</navType>
    <tabs>FMS_Dashboard</tabs>
    <tabs>Farm__c</tabs>
    <tabs>Farmer__c</tabs>
    <tabs>Crop_Production__c</tabs>
    <tabs>Buyer__c</tabs>
    <tabs>Sales_Transaction__c</tabs>
    <uiType>Lightning</uiType>
</CustomApplication>`;
writeFile('force-app/main/default/applications/Farm_Management_System.app-meta.xml', appXml);

// 4. Permission Sets for Role-based Access Control
// Role 1: Farm_Administrator (Full CRUD on all objects)
// Role 2: Farm_Manager (CRUD on Farms, Crops, Farmers; Read/Create on Sales)
// Role 3: Field_Officer_Farmer (Read/Edit Crops, Read Farms, Read Farmers)

const permSets = [
    {
        name: 'Farm_Administrator',
        label: 'Farm Administrator',
        desc: 'Superuser access with complete permissions for Farm Management System.',
        perms: {
            Farm__c: { c: true, r: true, u: true, d: true },
            Farmer__c: { c: true, r: true, u: true, d: true },
            Crop_Production__c: { c: true, r: true, u: true, d: true },
            Buyer__c: { c: true, r: true, u: true, d: true },
            Sales_Transaction__c: { c: true, r: true, u: true, d: true }
        }
    },
    {
        name: 'Farm_Manager',
        label: 'Farm Manager',
        desc: 'Operational management access for fields, crops, farmers, and buyer sales.',
        perms: {
            Farm__c: { c: true, r: true, u: true, d: false },
            Farmer__c: { c: true, r: true, u: true, d: false },
            Crop_Production__c: { c: true, r: true, u: true, d: true },
            Buyer__c: { c: true, r: true, u: true, d: false },
            Sales_Transaction__c: { c: true, r: true, u: true, d: false }
        }
    },
    {
        name: 'Field_Officer_Farmer',
        label: 'Field Officer / Farmer Lead',
        desc: 'Restricted field-level access for updating crop status and viewing assignments.',
        perms: {
            Farm__c: { c: false, r: true, u: false, d: false },
            Farmer__c: { c: false, r: true, u: false, d: false },
            Crop_Production__c: { c: false, r: true, u: true, d: false },
            Buyer__c: { c: false, r: true, u: false, d: false },
            Sales_Transaction__c: { c: false, r: false, u: false, d: false }
        }
    }
];

for (const ps of permSets) {
    let psXml = `<?xml version="1.0" encoding="UTF-8"?>
<PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata">
    <description>${ps.desc}</description>
    <hasActivationRequired>false</hasActivationRequired>
    <label>${ps.label}</label>
    <tabSettings>
        <tab>FMS_Dashboard</tab>
        <visibility>Visible</visibility>
    </tabSettings>`;

    for (const [objName, perm] of Object.entries(ps.perms)) {
        if (perm.r) {
            psXml += `
    <tabSettings>
        <tab>${objName}</tab>
        <visibility>Visible</visibility>
    </tabSettings>`;
        }
        psXml += `
    <objectPermissions>
        <allowCreate>${perm.c}</allowCreate>
        <allowDelete>${perm.d}</allowDelete>
        <allowEdit>${perm.u}</allowEdit>
        <allowRead>${perm.r}</allowRead>
        <modifyAllRecords>${perm.c && perm.d}</modifyAllRecords>
        <object>${objName}</object>
        <viewAllRecords>${perm.r}</viewAllRecords>
    </objectPermissions>`;
    }

    psXml += `
</PermissionSet>`;
    writeFile(`force-app/main/default/permissionsets/${ps.name}.permissionset-meta.xml`, psXml);
}

console.log('Validation rules, tabs, app, and permission sets created successfully.');
