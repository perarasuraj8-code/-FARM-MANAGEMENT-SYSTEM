import fs from 'fs';
import path from 'path';

const baseDir = process.cwd();

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function writeFile(relPath, content) {
    const fullPath = path.join(baseDir, relPath);
    ensureDir(path.dirname(fullPath));
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
    console.log(`Created: ${relPath}`);
}

console.log('Generating complete Salesforce Farm Management System metadata...');

// 1. Objects definition
const objects = [
    {
        name: 'Farm__c',
        label: 'Farm',
        plural: 'Farms',
        desc: 'Stores agricultural farm facility details, land size, soil type, and location.',
        nameField: { label: 'Farm Name', type: 'Text' },
        fields: [
            { name: 'Location__c', label: 'Location / District', type: 'Text', len: 100, required: true },
            { name: 'Total_Area_Acres__c', label: 'Total Area (Acres)', type: 'Number', precision: 8, scale: 2, required: true },
            { 
                name: 'Soil_Type__c', label: 'Soil Type', type: 'Picklist',
                values: ['Alluvial', 'Black Cotton', 'Red Loamy', 'Laterite', 'Clay', 'Sandy Loam']
            },
            {
                name: 'Water_Source__c', label: 'Water Source', type: 'Picklist',
                values: ['Borewell', 'Canal Irrigation', 'Rainfed', 'River / Stream', 'Drip System']
            },
            {
                name: 'Status__c', label: 'Farm Status', type: 'Picklist',
                values: ['Active', 'Fallow', 'Under Development', 'Leased']
            },
            { name: 'Manager_Name__c', label: 'Farm Manager', type: 'Text', len: 100, required: false },
            { name: 'Contact_Phone__c', label: 'Contact Phone', type: 'Phone', required: false }
        ]
    },
    {
        name: 'Farmer__c',
        label: 'Farmer',
        plural: 'Farmers',
        desc: 'Stores registered farmer profiles, national identification, land holdings, and assignments.',
        nameField: { label: 'Farmer Full Name', type: 'Text' },
        fields: [
            { name: 'Contact_Number__c', label: 'Contact Number', type: 'Phone', required: true },
            { name: 'Email__c', label: 'Email Address', type: 'Email', required: false },
            { name: 'Aadhaar_ID__c', label: 'Aadhaar / National ID', type: 'Text', len: 20, required: true },
            { name: 'Village__c', label: 'Village / Tehsil', type: 'Text', len: 100, required: true },
            { name: 'Land_Holding_Acres__c', label: 'Land Holding (Acres)', type: 'Number', precision: 6, scale: 2, required: true },
            { name: 'Experience_Years__c', label: 'Farming Experience (Years)', type: 'Number', precision: 3, scale: 0, required: false },
            {
                name: 'Status__c', label: 'Farmer Status', type: 'Picklist',
                values: ['Active Member', 'Seasonal Worker', 'Partner', 'Inactive']
            },
            {
                name: 'Assigned_Farm__c', label: 'Assigned Farm', type: 'Lookup', referenceTo: 'Farm__c', relationshipName: 'Farmers'
            }
        ]
    },
    {
        name: 'Crop_Production__c',
        label: 'Crop Production',
        plural: 'Crop Productions',
        desc: 'Tracks planting cycles, seasons, crop varieties, estimated yield, and actual harvest.',
        nameField: { label: 'Batch / Production Code', type: 'Text' },
        fields: [
            { name: 'Crop_Name__c', label: 'Crop Name', type: 'Text', len: 80, required: true },
            { name: 'Variety__c', label: 'Seed Variety / Hybrid', type: 'Text', len: 80, required: false },
            {
                name: 'Season__c', label: 'Crop Season', type: 'Picklist',
                values: ['Kharif (Monsoon)', 'Rabi (Winter)', 'Zaid (Summer)', 'Perennial']
            },
            { name: 'Sowing_Date__c', label: 'Sowing Date', type: 'Date', required: true },
            { name: 'Harvest_Date__c', label: 'Harvest Date', type: 'Date', required: false },
            { name: 'Estimated_Yield_Quintals__c', label: 'Estimated Yield (Quintals)', type: 'Number', precision: 8, scale: 2, required: true },
            { name: 'Actual_Yield_Quintals__c', label: 'Actual Yield (Quintals)', type: 'Number', precision: 8, scale: 2, required: false },
            {
                name: 'Status__c', label: 'Production Stage', type: 'Picklist',
                values: ['Sown / Germinating', 'Vegetative Growth', 'Flowering / Fruiting', 'Ready for Harvest', 'Harvested', 'Crop Damaged']
            },
            {
                name: 'Farm__c', label: 'Farm', type: 'MasterDetail', referenceTo: 'Farm__c', relationshipName: 'Crop_Productions'
            },
            {
                name: 'Farmer__c', label: 'Lead Farmer', type: 'Lookup', referenceTo: 'Farmer__c', relationshipName: 'Supervised_Crops'
            }
        ]
    },
    {
        name: 'Buyer__c',
        label: 'Buyer',
        plural: 'Buyers',
        desc: 'Registered produce procurement agencies, mandis, wholesalers, and retail buyers.',
        nameField: { label: 'Buyer / Agency Name', type: 'Text' },
        fields: [
            { name: 'Company_Name__c', label: 'Company / Business Entity', type: 'Text', len: 120, required: false },
            { name: 'Phone__c', label: 'Phone Number', type: 'Phone', required: true },
            { name: 'Email__c', label: 'Email Address', type: 'Email', required: false },
            {
                name: 'Buyer_Type__c', label: 'Buyer Type', type: 'Picklist',
                values: ['Government Mandi / APMC', 'Wholesale Trader', 'Retail Supermarket Chain', 'Food Processing Industry', 'Direct Exporter']
            },
            { name: 'City__c', label: 'City / Trading Hub', type: 'Text', len: 80, required: true },
            {
                name: 'Rating__c', label: 'Credit & Reliability Rating', type: 'Picklist',
                values: ['5 Star - Prompt Pay', '4 Star - Reliable', '3 Star - Regular', '2 Star - Delayed Pay']
            },
            {
                name: 'Status__c', label: 'Buyer Status', type: 'Picklist',
                values: ['Active', 'Pending Verification', 'Suspended']
            }
        ]
    },
    {
        name: 'Sales_Transaction__c',
        label: 'Sales Transaction',
        plural: 'Sales Transactions',
        desc: 'Financial and grain sales transaction records, invoices, payments, and settlements.',
        nameField: { label: 'Invoice Reference', type: 'Text' },
        fields: [
            {
                name: 'Crop_Production__c', label: 'Crop Production Batch', type: 'Lookup', referenceTo: 'Crop_Production__c', relationshipName: 'Sales_Transactions'
            },
            {
                name: 'Buyer__c', label: 'Buyer', type: 'Lookup', referenceTo: 'Buyer__c', relationshipName: 'Purchases'
            },
            { name: 'Quantity_Sold_Quintals__c', label: 'Quantity Sold (Quintals)', type: 'Number', precision: 8, scale: 2, required: true },
            { name: 'Price_Per_Quintal__c', label: 'Price per Quintal (₹)', type: 'Currency', precision: 10, scale: 2, required: true },
            { name: 'Total_Amount__c', label: 'Total Invoice Amount (₹)', type: 'Currency', precision: 12, scale: 2, required: true },
            { name: 'Amount_Paid__c', label: 'Amount Paid (₹)', type: 'Currency', precision: 12, scale: 2, required: true },
            { name: 'Pending_Amount__c', label: 'Pending Balance (₹)', type: 'Currency', precision: 12, scale: 2, required: false },
            {
                name: 'Payment_Status__c', label: 'Payment Status', type: 'Picklist',
                values: ['Payment Completed', 'Partial Payment', 'Pending Payment', 'Overdue']
            },
            {
                name: 'Payment_Method__c', label: 'Payment Method', type: 'Picklist',
                values: ['Bank NEFT / RTGS', 'UPI / IMPS', 'Cheque', 'Cash / Mandi Receipt']
            },
            { name: 'Transaction_Date__c', label: 'Transaction Date', type: 'Date', required: true }
        ]
    }
];

// Generate Custom Object XML and Field XMLs
for (const obj of objects) {
    const objXml = `<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <actionOverrides>
        <actionName>Accept</actionName>
        <type>Default</type>
    </actionOverrides>
    <actionOverrides>
        <actionName>CancelEdit</actionName>
        <type>Default</type>
    </actionOverrides>
    <actionOverrides>
        <actionName>Clone</actionName>
        <type>Default</type>
    </actionOverrides>
    <actionOverrides>
        <actionName>Delete</actionName>
        <type>Default</type>
    </actionOverrides>
    <actionOverrides>
        <actionName>Edit</actionName>
        <type>Default</type>
    </actionOverrides>
    <actionOverrides>
        <actionName>List</actionName>
        <type>Default</type>
    </actionOverrides>
    <actionOverrides>
        <actionName>New</actionName>
        <type>Default</type>
    </actionOverrides>
    <actionOverrides>
        <actionName>SaveEdit</actionName>
        <type>Default</type>
    </actionOverrides>
    <actionOverrides>
        <actionName>Tab</actionName>
        <type>Default</type>
    </actionOverrides>
    <actionOverrides>
        <actionName>View</actionName>
        <type>Default</type>
    </actionOverrides>
    <allowInChatterGroups>false</allowInChatterGroups>
    <compactLayoutAssignment>SYSTEM</compactLayoutAssignment>
    <deploymentStatus>Deployed</deploymentStatus>
    <description>${obj.desc}</description>
    <enableActivities>true</enableActivities>
    <enableBulkApi>true</enableBulkApi>
    <enableFeeds>false</enableFeeds>
    <enableHistory>true</enableHistory>
    <enableReports>true</enableReports>
    <enableSearch>true</enableSearch>
    <enableSharing>true</enableSharing>
    <enableStreamingApi>true</enableStreamingApi>
    <label>${obj.label}</label>
    <nameField>
        <label>${obj.nameField.label}</label>
        <type>${obj.nameField.type}</type>
    </nameField>
    <pluralLabel>${obj.plural}</pluralLabel>
    <sharingModel>${obj.fields.some(f => f.type === 'MasterDetail') ? 'ControlledByParent' : 'ReadWrite'}</sharingModel>
</CustomObject>`;

    writeFile(`force-app/main/default/objects/${obj.name}/${obj.name}.object-meta.xml`, objXml);

    for (const f of obj.fields) {
        let fieldXml = `<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>${f.name}</fullName>
    <externalId>false</externalId>
    <label>${f.label}</label>`;

        if (f.type === 'Text') {
            fieldXml += `
    <length>${f.len || 100}</length>
    <required>${f.required ? 'true' : 'false'}</required>
    <trackHistory>false</trackHistory>
    <type>Text</type>
    <unique>false</unique>`;
        } else if (f.type === 'Phone') {
            fieldXml += `
    <required>${f.required ? 'true' : 'false'}</required>
    <trackHistory>false</trackHistory>
    <type>Phone</type>`;
        } else if (f.type === 'Email') {
            fieldXml += `
    <required>${f.required ? 'true' : 'false'}</required>
    <trackHistory>false</trackHistory>
    <type>Email</type>
    <unique>false</unique>`;
        } else if (f.type === 'Number') {
            fieldXml += `
    <precision>${f.precision || 8}</precision>
    <required>${f.required ? 'true' : 'false'}</required>
    <scale>${f.scale || 0}</scale>
    <trackHistory>false</trackHistory>
    <type>Number</type>
    <unique>false</unique>`;
        } else if (f.type === 'Currency') {
            fieldXml += `
    <precision>${f.precision || 10}</precision>
    <required>${f.required ? 'true' : 'false'}</required>
    <scale>${f.scale || 2}</scale>
    <trackHistory>false</trackHistory>
    <type>Currency</type>`;
        } else if (f.type === 'Date') {
            fieldXml += `
    <required>${f.required ? 'true' : 'false'}</required>
    <trackHistory>false</trackHistory>
    <type>Date</type>`;
        } else if (f.type === 'Picklist') {
            fieldXml += `
    <required>${f.required ? 'true' : 'false'}</required>
    <trackHistory>false</trackHistory>
    <type>Picklist</type>
    <valueSet>
        <restricted>true</restricted>
        <valueSetDefinition>
            <sorted>false</sorted>
${f.values.map(v => `            <value>
                <fullName>${v}</fullName>
                <default>false</default>
                <label>${v}</label>
            </value>`).join('\n')}
        </valueSetDefinition>
    </valueSet>`;
        } else if (f.type === 'Lookup') {
            fieldXml += `
    <deleteConstraint>SetNull</deleteConstraint>
    <referenceTo>${f.referenceTo}</referenceTo>
    <relationshipLabel>${obj.plural}</relationshipLabel>
    <relationshipName>${f.relationshipName}</relationshipName>
    <required>false</required>
    <trackHistory>false</trackHistory>
    <type>Lookup</type>`;
        } else if (f.type === 'MasterDetail') {
            fieldXml += `
    <referenceTo>${f.referenceTo}</referenceTo>
    <relationshipLabel>${obj.plural}</relationshipLabel>
    <relationshipName>${f.relationshipName}</relationshipName>
    <relationshipOrder>0</relationshipOrder>
    <reparentableMasterDetail>false</reparentableMasterDetail>
    <trackHistory>false</trackHistory>
    <type>MasterDetail</type>
    <writeRequiresMasterRead>false</writeRequiresMasterRead>`;
        }

        fieldXml += `
</CustomField>`;
        writeFile(`force-app/main/default/objects/${obj.name}/fields/${f.name}.field-meta.xml`, fieldXml);
    }
}

console.log('Object schemas generated successfully.');
