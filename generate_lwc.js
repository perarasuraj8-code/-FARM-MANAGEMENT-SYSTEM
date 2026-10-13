import fs from 'fs';
import path from 'path';

const baseDir = process.cwd();
function writeFile(relPath, content) {
    const fullPath = path.join(baseDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
    console.log(`Created: ${relPath}`);
}

console.log('Generating Lightning Web Components (LWC)...');

// Helper for LWC js-meta.xml
function getLwcMetaXml(masterLabel, description) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>60.0</apiVersion>
    <isExposed>true</isExposed>
    <masterLabel>${masterLabel}</masterLabel>
    <description>${description}</description>
    <targets>
        <target>lightning__AppPage</target>
        <target>lightning__RecordPage</target>
        <target>lightning__HomePage</target>
        <target>lightning__Tab</target>
    </targets>
</LightningComponentBundle>`;
}

// --------------------------------------------------------------------------
// 1. fmsDashboard LWC
// --------------------------------------------------------------------------
const fmsDashboardHtml = `<template>
    <div class="fms-dashboard-wrapper">
        <!-- Top Metrics KPI Banner -->
        <div class="slds-grid slds-wrap slds-gutters slds-m-bottom_medium">
            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-4 slds-m-bottom_small">
                <div class="kpi-card green-accent">
                    <div class="kpi-icon-wrapper">
                        <lightning-icon icon-name="standard:location" size="medium" variant="inverse"></lightning-icon>
                    </div>
                    <div class="kpi-content">
                        <p class="kpi-title">Total Active Farms</p>
                        <h2 class="kpi-value">{kpiData.totalFarms}</h2>
                        <span class="kpi-subtext">{kpiData.totalAcres} Total Acres</span>
                    </div>
                </div>
            </div>

            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-4 slds-m-bottom_small">
                <div class="kpi-card blue-accent">
                    <div class="kpi-icon-wrapper">
                        <lightning-icon icon-name="standard:user" size="medium" variant="inverse"></lightning-icon>
                    </div>
                    <div class="kpi-content">
                        <p class="kpi-title">Registered Farmers</p>
                        <h2 class="kpi-value">{kpiData.totalFarmers}</h2>
                        <span class="kpi-subtext">Across All Districts</span>
                    </div>
                </div>
            </div>

            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-4 slds-m-bottom_small">
                <div class="kpi-card emerald-accent">
                    <div class="kpi-icon-wrapper">
                        <lightning-icon icon-name="standard:product" size="medium" variant="inverse"></lightning-icon>
                    </div>
                    <div class="kpi-content">
                        <p class="kpi-title">Harvested Produce</p>
                        <h2 class="kpi-value">{kpiData.totalYieldHarvested} Qtl</h2>
                        <span class="kpi-subtext">{kpiData.totalCropBatches} Crop Batches</span>
                    </div>
                </div>
            </div>

            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-4 slds-m-bottom_small">
                <div class="kpi-card amber-accent">
                    <div class="kpi-icon-wrapper">
                        <lightning-icon icon-name="standard:currency" size="medium" variant="inverse"></lightning-icon>
                    </div>
                    <div class="kpi-content">
                        <p class="kpi-title">Total Sales Revenue</p>
                        <h2 class="kpi-value">₹{formattedRevenue}</h2>
                        <span class="kpi-subtext pending-alert">₹{formattedPending} Pending</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Charts and Analytical Breakdowns -->
        <div class="slds-grid slds-wrap slds-gutters slds-m-bottom_medium">
            <div class="slds-col slds-size_1-of-1 slds-large-size_7-of-12 slds-m-bottom_small">
                <lightning-card title="Crop Production Distribution by Season" icon-name="custom:custom5">
                    <div class="slds-p-around_medium chart-container">
                        <div class="progress-bars-container">
                            <template for:each={seasonStats} for:item="item">
                                <div key={item.label} class="season-row slds-m-bottom_small">
                                    <div class="slds-grid slds-grid_align-spread slds-m-bottom_xx-small">
                                        <span class="season-label">{item.label}</span>
                                        <span class="season-val">{item.value} Batches ({item.percentage}%)</span>
                                    </div>
                                    <div class="bar-track">
                                        <div class="bar-fill" style={item.barStyle}></div>
                                    </div>
                                </div>
                            </template>
                        </div>
                    </div>
                </lightning-card>
            </div>

            <div class="slds-col slds-size_1-of-1 slds-large-size_5-of-12 slds-m-bottom_small">
                <lightning-card title="Financial Settlement Ratio" icon-name="custom:custom41">
                    <div class="slds-p-around_medium">
                        <div class="financial-circle-card">
                            <div class="stat-row">
                                <span class="badge-dot paid-dot"></span>
                                <span class="stat-name">Amount Realized:</span>
                                <strong class="stat-amt">₹{formattedPaid}</strong>
                            </div>
                            <div class="stat-row">
                                <span class="badge-dot pending-dot"></span>
                                <span class="stat-name">Outstanding Balance:</span>
                                <strong class="stat-amt text-danger">₹{formattedPending}</strong>
                            </div>
                            <div class="settlement-progress slds-m-top_medium">
                                <div class="progress-bar-paid" style={paidPercentageStyle}></div>
                            </div>
                            <p class="slds-text-align_center slds-m-top_small settlement-text">
                                {collectionRate}% of total billed revenue collected
                            </p>
                        </div>
                    </div>
                </lightning-card>
            </div>
        </div>

        <!-- Quick Summary Table of Recent Sales -->
        <lightning-card title="Recent Grain & Produce Invoices" icon-name="standard:orders">
            <lightning-button-group slot="actions">
                <lightning-button label="Refresh Data" icon-name="utility:refresh" onclick={handleRefresh}></lightning-button>
            </lightning-button-group>
            
            <div class="slds-p-around_small">
                <lightning-datatable
                    key-field="Id"
                    data={recentSales}
                    columns={columns}
                    hide-checkbox-column="true">
                </lightning-datatable>
            </div>
        </lightning-card>
    </div>
</template>`;

const fmsDashboardJs = `import { LightningElement, track, wire } from 'lwc';
import getDashboardKPIs from '@salesforce/apex/FarmManagementController.getDashboardKPIs';
import getCropSeasonDistribution from '@salesforce/apex/FarmManagementController.getCropSeasonDistribution';
import getSalesTransactions from '@salesforce/apex/FarmManagementController.getSalesTransactions';
import { refreshApex } from '@salesforce/apex';

const COLUMNS = [
    { label: 'Invoice No', fieldName: 'Name', type: 'text', initialWidth: 150 },
    { label: 'Crop Batch', fieldName: 'CropName', type: 'text' },
    { label: 'Buyer', fieldName: 'BuyerName', type: 'text' },
    { label: 'Qty (Qtl)', fieldName: 'Quantity_Sold_Quintals__c', type: 'number' },
    { label: 'Total (₹)', fieldName: 'Total_Amount__c', type: 'currency' },
    { label: 'Pending (₹)', fieldName: 'Pending_Amount__c', type: 'currency' },
    { label: 'Status', fieldName: 'Payment_Status__c', type: 'text' }
];

export default class FmsDashboard extends LightningElement {
    @track kpiData = {
        totalFarms: 0,
        totalAcres: 0,
        totalFarmers: 0,
        totalCropBatches: 0,
        totalYieldHarvested: 0,
        totalRevenue: 0,
        totalAmountPaid: 0,
        totalPendingPayment: 0,
        totalBuyers: 0
    };

    @track seasonStats = [];
    @track recentSales = [];
    columns = COLUMNS;
    wiredKpiResult;
    wiredSalesResult;

    @wire(getDashboardKPIs)
    wiredKPI(result) {
        this.wiredKpiResult = result;
        if (result.data) {
            this.kpiData = result.data;
        }
    }

    @wire(getCropSeasonDistribution)
    wiredSeasons(result) {
        if (result.data) {
            const total = result.data.reduce((acc, curr) => acc + (curr.value || 0), 0) || 1;
            this.seasonStats = result.data.map(item => {
                const pct = Math.round((item.value / total) * 100);
                return {
                    label: item.label,
                    value: item.value,
                    percentage: pct,
                    barStyle: \`width: \${pct}%; background-color: #2e7d32;\`
                };
            });
        }
    }

    @wire(getSalesTransactions, { searchTerm: '', paymentStatusFilter: 'All' })
    wiredSales(result) {
        this.wiredSalesResult = result;
        if (result.data) {
            this.recentSales = result.data.slice(0, 5).map(s => ({
                ...s,
                CropName: s.Crop_Production__r ? s.Crop_Production__r.Crop_Name__c : 'Produce',
                BuyerName: s.Buyer__r ? s.Buyer__r.Name : 'Registered Buyer'
            }));
        }
    }

    get formattedRevenue() {
        return (this.kpiData.totalRevenue || 0).toLocaleString('en-IN');
    }

    get formattedPaid() {
        return (this.kpiData.totalAmountPaid || 0).toLocaleString('en-IN');
    }

    get formattedPending() {
        return (this.kpiData.totalPendingPayment || 0).toLocaleString('en-IN');
    }

    get collectionRate() {
        if (!this.kpiData.totalRevenue || this.kpiData.totalRevenue === 0) return 0;
        return Math.round((this.kpiData.totalAmountPaid / this.kpiData.totalRevenue) * 100);
    }

    get paidPercentageStyle() {
        return \`width: \${this.collectionRate}%; background: #2e7d32; height: 12px; border-radius: 6px;\`;
    }

    handleRefresh() {
        refreshApex(this.wiredKpiResult);
        refreshApex(this.wiredSalesResult);
    }
}`;

const fmsDashboardCss = `.fms-dashboard-wrapper {
    background-color: #f7faf7;
    padding: 1rem;
    border-radius: 8px;
}

.kpi-card {
    display: flex;
    align-items: center;
    background: #ffffff;
    border-radius: 12px;
    padding: 1.25rem 1rem;
    box-shadow: 0 4px 12px rgba(46, 125, 50, 0.08);
    border-left: 5px solid #2e7d32;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kpi-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(46, 125, 50, 0.15);
}

.green-accent { border-left-color: #2e7d32; }
.blue-accent { border-left-color: #0288d1; }
.emerald-accent { border-left-color: #00897b; }
.amber-accent { border-left-color: #f57c00; }

.kpi-icon-wrapper {
    background: #e8f5e9;
    border-radius: 10px;
    padding: 0.6rem;
    margin-right: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

.kpi-content {
    flex: 1;
}

.kpi-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: #556b2f;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0;
}

.kpi-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1b5e20;
    margin: 0.2rem 0;
}

.kpi-subtext {
    font-size: 0.75rem;
    color: #666;
}

.pending-alert {
    color: #d32f2f;
    font-weight: 600;
}

.bar-track {
    width: 100%;
    background-color: #e0e0e0;
    height: 10px;
    border-radius: 5px;
    overflow: hidden;
}

.bar-fill {
    height: 100%;
    transition: width 0.6s ease;
}

.financial-circle-card {
    background: #ffffff;
    border-radius: 8px;
    padding: 1rem;
}

.stat-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid #f0f0f0;
}

.badge-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
    margin-right: 8px;
}
.paid-dot { background-color: #2e7d32; }
.pending-dot { background-color: #d32f2f; }

.text-danger { color: #d32f2f; }

.settlement-progress {
    width: 100%;
    background-color: #ffebee;
    border-radius: 6px;
    overflow: hidden;
    height: 12px;
}

.settlement-text {
    font-size: 0.85rem;
    font-weight: 600;
    color: #2e7d32;
}`;

writeFile('force-app/main/default/lwc/fmsDashboard/fmsDashboard.html', fmsDashboardHtml);
writeFile('force-app/main/default/lwc/fmsDashboard/fmsDashboard.js', fmsDashboardJs);
writeFile('force-app/main/default/lwc/fmsDashboard/fmsDashboard.css', fmsDashboardCss);
writeFile('force-app/main/default/lwc/fmsDashboard/fmsDashboard.js-meta.xml', getLwcMetaXml('FMS Dashboard', 'Real-time Agricultural and Financial Dashboard'));

// --------------------------------------------------------------------------
// 2. fmsFarmManager LWC
// --------------------------------------------------------------------------
const fmsFarmManagerHtml = `<template>
    <div class="fms-container">
        <!-- Control Header -->
        <lightning-card title="Farm Records & Facility Directory" icon-name="custom:custom40">
            <div slot="actions">
                <lightning-button 
                    label="Add New Farm" 
                    icon-name="utility:add" 
                    variant="brand" 
                    onclick={handleOpenNewModal}>
                </lightning-button>
            </div>

            <!-- Search and Filter Bar -->
            <div class="slds-p-horizontal_medium slds-p-bottom_small">
                <div class="slds-grid slds-gutters slds-wrap">
                    <div class="slds-col slds-size_1-of-1 slds-medium-size_6-of-12">
                        <lightning-input 
                            type="search" 
                            label="Search Farms" 
                            placeholder="Search by name, location, or manager..." 
                            value={searchTerm} 
                            onchange={handleSearchChange}>
                        </lightning-input>
                    </div>
                    <div class="slds-col slds-size_1-of-1 slds-medium-size_4-of-12">
                        <lightning-combobox 
                            name="statusFilter" 
                            label="Filter by Status" 
                            value={statusFilter} 
                            options={statusOptions} 
                            onchange={handleStatusFilterChange}>
                        </lightning-combobox>
                    </div>
                    <div class="slds-col slds-size_1-of-1 slds-medium-size_2-of-12 slds-align-bottom slds-m-top_small">
                        <lightning-button label="Reset" icon-name="utility:clear" onclick={handleResetFilters}></lightning-button>
                    </div>
                </div>
            </div>

            <!-- Farms Data Table -->
            <div class="slds-p-around_medium">
                <template if:true={isLoading}>
                    <lightning-spinner alternative-text="Loading Farms..."></lightning-spinner>
                </template>
                <lightning-datatable
                    key-field="Id"
                    data={farms}
                    columns={columns}
                    onrowaction={handleRowAction}
                    hide-checkbox-column="true">
                </lightning-datatable>
            </div>
        </lightning-card>

        <!-- Add/Edit Farm Modal -->
        <template if:true={isModalOpen}>
            <section role="dialog" tabindex="-1" class="slds-modal slds-fade-in-open slds-modal_medium">
                <div class="slds-modal__container">
                    <header class="slds-modal__header modal-green-header">
                        <h2 class="slds-text-heading_medium">{modalTitle}</h2>
                    </header>
                    <div class="slds-modal__content slds-p-around_medium">
                        <div class="slds-grid slds-wrap slds-gutters">
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input label="Farm Name" required value={currentFarm.Name} data-field="Name" onchange={handleFieldChange}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input label="Location / District" required value={currentFarm.Location__c} data-field="Location__c" onchange={handleFieldChange}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input type="number" step="0.01" label="Total Area (Acres)" required value={currentFarm.Total_Area_Acres__c} data-field="Total_Area_Acres__c" onchange={handleFieldChange}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-combobox label="Soil Type" value={currentFarm.Soil_Type__c} options={soilOptions} data-field="Soil_Type__c" onchange={handleFieldChange}></lightning-combobox>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-combobox label="Water Source" value={currentFarm.Water_Source__c} options={waterOptions} data-field="Water_Source__c" onchange={handleFieldChange}></lightning-combobox>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-combobox label="Status" value={currentFarm.Status__c} options={statusOptionsWithoutAll} data-field="Status__c" onchange={handleFieldChange}></lightning-combobox>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input label="Farm Manager Name" value={currentFarm.Manager_Name__c} data-field="Manager_Name__c" onchange={handleFieldChange}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input type="tel" label="Contact Phone" value={currentFarm.Contact_Phone__c} data-field="Contact_Phone__c" onchange={handleFieldChange}></lightning-input>
                            </div>
                        </div>
                    </div>
                    <footer class="slds-modal__footer">
                        <lightning-button label="Cancel" onclick={handleCloseModal} class="slds-m-right_small"></lightning-button>
                        <lightning-button variant="brand" label="Save Farm" onclick={handleSaveFarm}></lightning-button>
                    </footer>
                </div>
            </section>
            <div class="slds-backdrop slds-backdrop_open"></div>
        </template>
    </div>
</template>`;

const fmsFarmManagerJs = `import { LightningElement, track, wire } from 'lwc';
import getFarms from '@salesforce/apex/FarmManagementController.getFarms';
import saveFarm from '@salesforce/apex/FarmManagementController.saveFarm';
import deleteFarm from '@salesforce/apex/FarmManagementController.deleteFarm';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

const ACTIONS = [
    { label: 'Edit', name: 'edit', iconName: 'utility:edit' },
    { label: 'Delete', name: 'delete', iconName: 'utility:delete' }
];

const COLUMNS = [
    { label: 'Farm Name', fieldName: 'Name', type: 'text' },
    { label: 'Location', fieldName: 'Location__c', type: 'text' },
    { label: 'Area (Acres)', fieldName: 'Total_Area_Acres__c', type: 'number' },
    { label: 'Soil Type', fieldName: 'Soil_Type__c', type: 'text' },
    { label: 'Water Source', fieldName: 'Water_Source__c', type: 'text' },
    { label: 'Status', fieldName: 'Status__c', type: 'text' },
    { label: 'Manager', fieldName: 'Manager_Name__c', type: 'text' },
    { type: 'action', typeAttributes: { rowActions: ACTIONS } }
];

export default class FmsFarmManager extends LightningElement {
    @track farms = [];
    @track searchTerm = '';
    @track statusFilter = 'All';
    @track isLoading = false;
    @track isModalOpen = false;
    @track modalTitle = 'Add New Farm';
    @track currentFarm = {};

    columns = COLUMNS;
    wiredFarmsResult;

    statusOptions = [
        { label: 'All Statuses', value: 'All' },
        { label: 'Active', value: 'Active' },
        { label: 'Fallow', value: 'Fallow' },
        { label: 'Under Development', value: 'Under Development' },
        { label: 'Leased', value: 'Leased' }
    ];

    statusOptionsWithoutAll = [
        { label: 'Active', value: 'Active' },
        { label: 'Fallow', value: 'Fallow' },
        { label: 'Under Development', value: 'Under Development' },
        { label: 'Leased', value: 'Leased' }
    ];

    soilOptions = [
        { label: 'Alluvial', value: 'Alluvial' },
        { label: 'Black Cotton', value: 'Black Cotton' },
        { label: 'Red Loamy', value: 'Red Loamy' },
        { label: 'Laterite', value: 'Laterite' },
        { label: 'Clay', value: 'Clay' },
        { label: 'Sandy Loam', value: 'Sandy Loam' }
    ];

    waterOptions = [
        { label: 'Borewell', value: 'Borewell' },
        { label: 'Canal Irrigation', value: 'Canal Irrigation' },
        { label: 'Rainfed', value: 'Rainfed' },
        { label: 'River / Stream', value: 'River / Stream' },
        { label: 'Drip System', value: 'Drip System' }
    ];

    @wire(getFarms, { searchTerm: '$searchTerm', statusFilter: '$statusFilter' })
    wiredFarms(result) {
        this.wiredFarmsResult = result;
        if (result.data) {
            this.farms = result.data;
            this.isLoading = false;
        } else if (result.error) {
            this.isLoading = false;
        }
    }

    handleSearchChange(event) {
        this.searchTerm = event.target.value;
    }

    handleStatusFilterChange(event) {
        this.statusFilter = event.target.value;
    }

    handleResetFilters() {
        this.searchTerm = '';
        this.statusFilter = 'All';
    }

    handleOpenNewModal() {
        this.currentFarm = {
            Name: '',
            Location__c: '',
            Total_Area_Acres__c: null,
            Soil_Type__c: 'Black Cotton',
            Water_Source__c: 'Borewell',
            Status__c: 'Active',
            Manager_Name__c: '',
            Contact_Phone__c: ''
        };
        this.modalTitle = 'Add New Farm';
        this.isModalOpen = true;
    }

    handleCloseModal() {
        this.isModalOpen = false;
    }

    handleFieldChange(event) {
        const field = event.target.dataset.field;
        this.currentFarm[field] = event.target.value;
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        if (actionName === 'edit') {
            this.currentFarm = { ...row };
            this.modalTitle = 'Edit Farm: ' + row.Name;
            this.isModalOpen = true;
        } else if (actionName === 'delete') {
            this.handleDeleteFarm(row.Id);
        }
    }

    async handleSaveFarm() {
        if (!this.currentFarm.Name || !this.currentFarm.Location__c || !this.currentFarm.Total_Area_Acres__c) {
            this.showToast('Validation Error', 'Please fill required fields (Name, Location, Area)', 'error');
            return;
        }
        if (parseFloat(this.currentFarm.Total_Area_Acres__c) <= 0) {
            this.showToast('Validation Error', 'Total Area must be greater than zero.', 'error');
            return;
        }

        try {
            await saveFarm({ farmRecord: this.currentFarm });
            this.showToast('Success', 'Farm saved successfully', 'success');
            this.isModalOpen = false;
            refreshApex(this.wiredFarmsResult);
        } catch (error) {
            this.showToast('Error saving farm', error.body ? error.body.message : error.message, 'error');
        }
    }

    async handleDeleteFarm(farmId) {
        try {
            await deleteFarm({ farmId: farmId });
            this.showToast('Success', 'Farm record removed', 'success');
            refreshApex(this.wiredFarmsResult);
        } catch (error) {
            this.showToast('Error deleting farm', error.body ? error.body.message : error.message, 'error');
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}`;

const fmsFarmManagerCss = `.fms-container {
    background-color: #ffffff;
    border-radius: 8px;
}
.modal-green-header {
    background-color: #2e7d32;
    color: #ffffff;
}`;

writeFile('force-app/main/default/lwc/fmsFarmManager/fmsFarmManager.html', fmsFarmManagerHtml);
writeFile('force-app/main/default/lwc/fmsFarmManager/fmsFarmManager.js', fmsFarmManagerJs);
writeFile('force-app/main/default/lwc/fmsFarmManager/fmsFarmManager.css', fmsFarmManagerCss);
writeFile('force-app/main/default/lwc/fmsFarmManager/fmsFarmManager.js-meta.xml', getLwcMetaXml('FMS Farm Manager', 'Farm Records and Facilities Management'));

// --------------------------------------------------------------------------
// 3. fmsFarmerManager LWC
// --------------------------------------------------------------------------
const fmsFarmerManagerHtml = `<template>
    <div class="fms-container">
        <lightning-card title="Registered Farmer Profiles" icon-name="custom:custom15">
            <div slot="actions">
                <lightning-button label="Register Farmer" icon-name="utility:add" variant="brand" onclick={handleOpenNewModal}></lightning-button>
            </div>
            
            <div class="slds-p-horizontal_medium slds-p-bottom_small">
                <div class="slds-grid slds-gutters slds-wrap">
                    <div class="slds-col slds-size_1-of-1 slds-medium-size_8-of-12">
                        <lightning-input type="search" label="Search Farmers" placeholder="Search by name, village, or mobile..." value={searchTerm} onchange={handleSearchChange}></lightning-input>
                    </div>
                    <div class="slds-col slds-size_1-of-1 slds-medium-size_4-of-12 slds-align-bottom slds-m-top_small">
                        <lightning-button label="Reset Search" icon-name="utility:clear" onclick={handleResetFilters}></lightning-button>
                    </div>
                </div>
            </div>

            <div class="slds-p-around_medium">
                <lightning-datatable
                    key-field="Id"
                    data={farmers}
                    columns={columns}
                    onrowaction={handleRowAction}
                    hide-checkbox-column="true">
                </lightning-datatable>
            </div>
        </lightning-card>

        <template if:true={isModalOpen}>
            <section role="dialog" tabindex="-1" class="slds-modal slds-fade-in-open slds-modal_medium">
                <div class="slds-modal__container">
                    <header class="slds-modal__header modal-green-header">
                        <h2 class="slds-text-heading_medium">{modalTitle}</h2>
                    </header>
                    <div class="slds-modal__content slds-p-around_medium">
                        <div class="slds-grid slds-wrap slds-gutters">
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input label="Farmer Full Name" required value={currentFarmer.Name} data-field="Name" onchange={handleFieldChange}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input type="tel" label="Contact Mobile Number" required value={currentFarmer.Contact_Number__c} data-field="Contact_Number__c" onchange={handleFieldChange}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input label="Aadhaar / National ID (12 Digits)" required value={currentFarmer.Aadhaar_ID__c} data-field="Aadhaar_ID__c" onchange={handleFieldChange}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input label="Village / Tehsil" required value={currentFarmer.Village__c} data-field="Village__c" onchange={handleFieldChange}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input type="number" step="0.01" label="Land Holding (Acres)" required value={currentFarmer.Land_Holding_Acres__c} data-field="Land_Holding_Acres__c" onchange={handleFieldChange}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input type="number" label="Experience (Years)" value={currentFarmer.Experience_Years__c} data-field="Experience_Years__c" onchange={handleFieldChange}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-combobox label="Farmer Status" value={currentFarmer.Status__c} options={statusOptions} data-field="Status__c" onchange={handleFieldChange}></lightning-combobox>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input type="email" label="Email Address" value={currentFarmer.Email__c} data-field="Email__c" onchange={handleFieldChange}></lightning-input>
                            </div>
                        </div>
                    </div>
                    <footer class="slds-modal__footer">
                        <lightning-button label="Cancel" onclick={handleCloseModal} class="slds-m-right_small"></lightning-button>
                        <lightning-button variant="brand" label="Save Farmer" onclick={handleSaveFarmer}></lightning-button>
                    </footer>
                </div>
            </section>
            <div class="slds-backdrop slds-backdrop_open"></div>
        </template>
    </div>
</template>`;

const fmsFarmerManagerJs = `import { LightningElement, track, wire } from 'lwc';
import getFarmers from '@salesforce/apex/FarmManagementController.getFarmers';
import saveFarmer from '@salesforce/apex/FarmManagementController.saveFarmer';
import deleteFarmer from '@salesforce/apex/FarmManagementController.deleteFarmer';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

const ACTIONS = [
    { label: 'Edit', name: 'edit', iconName: 'utility:edit' },
    { label: 'Delete', name: 'delete', iconName: 'utility:delete' }
];

const COLUMNS = [
    { label: 'Farmer Name', fieldName: 'Name', type: 'text' },
    { label: 'Contact Phone', fieldName: 'Contact_Number__c', type: 'phone' },
    { label: 'Aadhaar ID', fieldName: 'Aadhaar_ID__c', type: 'text' },
    { label: 'Village', fieldName: 'Village__c', type: 'text' },
    { label: 'Land (Acres)', fieldName: 'Land_Holding_Acres__c', type: 'number' },
    { label: 'Experience (Yrs)', fieldName: 'Experience_Years__c', type: 'number' },
    { label: 'Status', fieldName: 'Status__c', type: 'text' },
    { type: 'action', typeAttributes: { rowActions: ACTIONS } }
];

export default class FmsFarmerManager extends LightningElement {
    @track farmers = [];
    @track searchTerm = '';
    @track isModalOpen = false;
    @track modalTitle = 'Register Farmer';
    @track currentFarmer = {};

    columns = COLUMNS;
    wiredFarmersResult;

    statusOptions = [
        { label: 'Active Member', value: 'Active Member' },
        { label: 'Seasonal Worker', value: 'Seasonal Worker' },
        { label: 'Partner', value: 'Partner' },
        { label: 'Inactive', value: 'Inactive' }
    ];

    @wire(getFarmers, { searchTerm: '$searchTerm', farmIdFilter: 'All' })
    wiredFarmers(result) {
        this.wiredFarmersResult = result;
        if (result.data) {
            this.farmers = result.data;
        }
    }

    handleSearchChange(event) {
        this.searchTerm = event.target.value;
    }

    handleResetFilters() {
        this.searchTerm = '';
    }

    handleOpenNewModal() {
        this.currentFarmer = {
            Name: '',
            Contact_Number__c: '',
            Aadhaar_ID__c: '',
            Village__c: '',
            Land_Holding_Acres__c: null,
            Experience_Years__c: 5,
            Status__c: 'Active Member',
            Email__c: ''
        };
        this.modalTitle = 'Register Farmer';
        this.isModalOpen = true;
    }

    handleCloseModal() {
        this.isModalOpen = false;
    }

    handleFieldChange(event) {
        const field = event.target.dataset.field;
        this.currentFarmer[field] = event.target.value;
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        if (actionName === 'edit') {
            this.currentFarmer = { ...row };
            this.modalTitle = 'Edit Farmer: ' + row.Name;
            this.isModalOpen = true;
        } else if (actionName === 'delete') {
            this.handleDelete(row.Id);
        }
    }

    async handleSaveFarmer() {
        if (!this.currentFarmer.Name || !this.currentFarmer.Contact_Number__c || !this.currentFarmer.Aadhaar_ID__c) {
            this.showToast('Validation Error', 'Farmer Name, Phone, and Aadhaar ID are mandatory.', 'error');
            return;
        }
        if (this.currentFarmer.Aadhaar_ID__c.length < 12) {
            this.showToast('Validation Error', 'Aadhaar / National ID must be at least 12 digits.', 'error');
            return;
        }

        try {
            await saveFarmer({ farmerRecord: this.currentFarmer });
            this.showToast('Success', 'Farmer profile saved', 'success');
            this.isModalOpen = false;
            refreshApex(this.wiredFarmersResult);
        } catch (error) {
            this.showToast('Error', error.body ? error.body.message : error.message, 'error');
        }
    }

    async handleDelete(farmerId) {
        try {
            await deleteFarmer({ farmerId: farmerId });
            this.showToast('Success', 'Farmer profile deleted', 'success');
            refreshApex(this.wiredFarmersResult);
        } catch (error) {
            this.showToast('Error', error.body ? error.body.message : error.message, 'error');
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}`;

writeFile('force-app/main/default/lwc/fmsFarmerManager/fmsFarmerManager.html', fmsFarmerManagerHtml);
writeFile('force-app/main/default/lwc/fmsFarmerManager/fmsFarmerManager.js', fmsFarmerManagerJs);
writeFile('force-app/main/default/lwc/fmsFarmerManager/fmsFarmerManager.css', fmsFarmManagerCss);
writeFile('force-app/main/default/lwc/fmsFarmerManager/fmsFarmerManager.js-meta.xml', getLwcMetaXml('FMS Farmer Manager', 'Farmer Registration and Profiles'));

// --------------------------------------------------------------------------
// 4. fmsCropManager LWC
// --------------------------------------------------------------------------
const fmsCropManagerHtml = `<template>
    <div class="fms-container">
        <lightning-card title="Crop Cultivation & Harvest Tracking" icon-name="custom:custom5">
            <div slot="actions">
                <lightning-button label="Log Crop Batch" icon-name="utility:add" variant="brand" onclick={handleOpenNewModal}></lightning-button>
            </div>

            <div class="slds-p-horizontal_medium slds-p-bottom_small">
                <div class="slds-grid slds-gutters slds-wrap">
                    <div class="slds-col slds-size_1-of-1 slds-medium-size_5-of-12">
                        <lightning-input type="search" label="Search Crops" placeholder="Crop name or batch code..." value={searchTerm} onchange={handleSearchChange}></lightning-input>
                    </div>
                    <div class="slds-col slds-size_1-of-1 slds-medium-size_3-of-12">
                        <lightning-combobox label="Season" value={seasonFilter} options={seasonFilterOptions} onchange={handleSeasonChange}></lightning-combobox>
                    </div>
                    <div class="slds-col slds-size_1-of-1 slds-medium-size_3-of-12">
                        <lightning-combobox label="Stage" value={statusFilter} options={stageFilterOptions} onchange={handleStageChange}></lightning-combobox>
                    </div>
                    <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-12 slds-align-bottom slds-m-top_small">
                        <lightning-button label="Reset" icon-name="utility:clear" onclick={handleResetFilters}></lightning-button>
                    </div>
                </div>
            </div>

            <div class="slds-p-around_medium">
                <lightning-datatable
                    key-field="Id"
                    data={cropBatches}
                    columns={columns}
                    onrowaction={handleRowAction}
                    hide-checkbox-column="true">
                </lightning-datatable>
            </div>
        </lightning-card>

        <template if:true={isModalOpen}>
            <section role="dialog" tabindex="-1" class="slds-modal slds-fade-in-open slds-modal_medium">
                <div class="slds-modal__container">
                    <header class="slds-modal__header modal-green-header">
                        <h2 class="slds-text-heading_medium">{modalTitle}</h2>
                    </header>
                    <div class="slds-modal__content slds-p-around_medium">
                        <div class="slds-grid slds-wrap slds-gutters">
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input label="Batch Identifier" required value={currentCrop.Name} data-field="Name" onchange={handleFieldChange}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input label="Crop Name (e.g., Wheat, Cotton)" required value={currentCrop.Crop_Name__c} data-field="Crop_Name__c" onchange={handleFieldChange}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input label="Seed Variety / Hybrid" value={currentCrop.Variety__c} data-field="Variety__c" onchange={handleFieldChange}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-combobox label="Season" value={currentCrop.Season__c} options={seasonOptions} data-field="Season__c" onchange={handleFieldChange}></lightning-combobox>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input type="date" label="Sowing Date" required value={currentCrop.Sowing_Date__c} data-field="Sowing_Date__c" onchange={handleFieldChange}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input type="date" label="Harvest Date" value={currentCrop.Harvest_Date__c} data-field="Harvest_Date__c" onchange={handleFieldChange}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input type="number" step="0.01" label="Estimated Yield (Quintals)" required value={currentCrop.Estimated_Yield_Quintals__c} data-field="Estimated_Yield_Quintals__c" onchange={handleFieldChange}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input type="number" step="0.01" label="Actual Harvested Yield (Quintals)" value={currentCrop.Actual_Yield_Quintals__c} data-field="Actual_Yield_Quintals__c" onchange={handleFieldChange}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-combobox label="Cultivation Stage" value={currentCrop.Status__c} options={stageOptions} data-field="Status__c" onchange={handleFieldChange}></lightning-combobox>
                            </div>
                        </div>
                    </div>
                    <footer class="slds-modal__footer">
                        <lightning-button label="Cancel" onclick={handleCloseModal} class="slds-m-right_small"></lightning-button>
                        <lightning-button variant="brand" label="Save Batch" onclick={handleSaveCrop}></lightning-button>
                    </footer>
                </div>
            </section>
            <div class="slds-backdrop slds-backdrop_open"></div>
        </template>
    </div>
</template>`;

const fmsCropManagerJs = `import { LightningElement, track, wire } from 'lwc';
import getCropProductions from '@salesforce/apex/FarmManagementController.getCropProductions';
import saveCropProduction from '@salesforce/apex/FarmManagementController.saveCropProduction';
import deleteCropProduction from '@salesforce/apex/FarmManagementController.deleteCropProduction';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

const ACTIONS = [
    { label: 'Edit', name: 'edit', iconName: 'utility:edit' },
    { label: 'Delete', name: 'delete', iconName: 'utility:delete' }
];

const COLUMNS = [
    { label: 'Batch Code', fieldName: 'Name', type: 'text' },
    { label: 'Crop Name', fieldName: 'Crop_Name__c', type: 'text' },
    { label: 'Variety', fieldName: 'Variety__c', type: 'text' },
    { label: 'Season', fieldName: 'Season__c', type: 'text' },
    { label: 'Sowing Date', fieldName: 'Sowing_Date__c', type: 'date' },
    { label: 'Est. Yield (Qtl)', fieldName: 'Estimated_Yield_Quintals__c', type: 'number' },
    { label: 'Act. Yield (Qtl)', fieldName: 'Actual_Yield_Quintals__c', type: 'number' },
    { label: 'Stage', fieldName: 'Status__c', type: 'text' },
    { type: 'action', typeAttributes: { rowActions: ACTIONS } }
];

export default class FmsCropManager extends LightningElement {
    @track cropBatches = [];
    @track searchTerm = '';
    @track seasonFilter = 'All';
    @track statusFilter = 'All';
    @track isModalOpen = false;
    @track modalTitle = 'Log Crop Batch';
    @track currentCrop = {};

    columns = COLUMNS;
    wiredCropsResult;

    seasonOptions = [
        { label: 'Kharif (Monsoon)', value: 'Kharif (Monsoon)' },
        { label: 'Rabi (Winter)', value: 'Rabi (Winter)' },
        { label: 'Zaid (Summer)', value: 'Zaid (Summer)' },
        { label: 'Perennial', value: 'Perennial' }
    ];

    seasonFilterOptions = [
        { label: 'All Seasons', value: 'All' },
        ...this.seasonOptions
    ];

    stageOptions = [
        { label: 'Sown / Germinating', value: 'Sown / Germinating' },
        { label: 'Vegetative Growth', value: 'Vegetative Growth' },
        { label: 'Flowering / Fruiting', value: 'Flowering / Fruiting' },
        { label: 'Ready for Harvest', value: 'Ready for Harvest' },
        { label: 'Harvested', value: 'Harvested' },
        { label: 'Crop Damaged', value: 'Crop Damaged' }
    ];

    stageFilterOptions = [
        { label: 'All Stages', value: 'All' },
        ...this.stageOptions
    ];

    @wire(getCropProductions, { searchTerm: '$searchTerm', seasonFilter: '$seasonFilter', statusFilter: '$statusFilter' })
    wiredCrops(result) {
        this.wiredCropsResult = result;
        if (result.data) {
            this.cropBatches = result.data;
        }
    }

    handleSearchChange(event) { this.searchTerm = event.target.value; }
    handleSeasonChange(event) { this.seasonFilter = event.target.value; }
    handleStageChange(event) { this.statusFilter = event.target.value; }
    handleResetFilters() {
        this.searchTerm = '';
        this.seasonFilter = 'All';
        this.statusFilter = 'All';
    }

    handleOpenNewModal() {
        this.currentCrop = {
            Name: 'BATCH-' + Math.floor(1000 + Math.random() * 9000),
            Crop_Name__c: '',
            Variety__c: '',
            Season__c: 'Kharif (Monsoon)',
            Sowing_Date__c: new Date().toISOString().slice(0, 10),
            Harvest_Date__c: '',
            Estimated_Yield_Quintals__c: 100,
            Actual_Yield_Quintals__c: null,
            Status__c: 'Vegetative Growth'
        };
        this.modalTitle = 'Log Crop Batch';
        this.isModalOpen = true;
    }

    handleCloseModal() { this.isModalOpen = false; }

    handleFieldChange(event) {
        const field = event.target.dataset.field;
        this.currentCrop[field] = event.target.value;
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        if (actionName === 'edit') {
            this.currentCrop = { ...row };
            this.modalTitle = 'Edit Batch: ' + row.Name;
            this.isModalOpen = true;
        } else if (actionName === 'delete') {
            this.handleDelete(row.Id);
        }
    }

    async handleSaveCrop() {
        if (!this.currentCrop.Crop_Name__c || !this.currentCrop.Sowing_Date__c || !this.currentCrop.Estimated_Yield_Quintals__c) {
            this.showToast('Validation Error', 'Crop Name, Sowing Date, and Estimated Yield are mandatory.', 'error');
            return;
        }
        if (this.currentCrop.Harvest_Date__c && this.currentCrop.Harvest_Date__c < this.currentCrop.Sowing_Date__c) {
            this.showToast('Validation Error', 'Harvest Date cannot precede Sowing Date.', 'error');
            return;
        }

        try {
            await saveCropProduction({ cropRecord: this.currentCrop });
            this.showToast('Success', 'Crop batch record saved', 'success');
            this.isModalOpen = false;
            refreshApex(this.wiredCropsResult);
        } catch (error) {
            this.showToast('Error', error.body ? error.body.message : error.message, 'error');
        }
    }

    async handleDelete(cropId) {
        try {
            await deleteCropProduction({ cropId: cropId });
            this.showToast('Success', 'Crop record removed', 'success');
            refreshApex(this.wiredCropsResult);
        } catch (error) {
            this.showToast('Error', error.body ? error.body.message : error.message, 'error');
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}`;

writeFile('force-app/main/default/lwc/fmsCropManager/fmsCropManager.html', fmsCropManagerHtml);
writeFile('force-app/main/default/lwc/fmsCropManager/fmsCropManager.js', fmsCropManagerJs);
writeFile('force-app/main/default/lwc/fmsCropManager/fmsCropManager.css', fmsFarmManagerCss);
writeFile('force-app/main/default/lwc/fmsCropManager/fmsCropManager.js-meta.xml', getLwcMetaXml('FMS Crop Manager', 'Crop Production and Harvest Tracking'));

// --------------------------------------------------------------------------
// 5. fmsBuyerManager LWC
// --------------------------------------------------------------------------
const fmsBuyerManagerHtml = `<template>
    <div class="fms-container">
        <lightning-card title="Produce Procurement Buyers & Mandis" icon-name="custom:custom68">
            <div slot="actions">
                <lightning-button label="Add Buyer Agency" icon-name="utility:add" variant="brand" onclick={handleOpenNewModal}></lightning-button>
            </div>

            <div class="slds-p-horizontal_medium slds-p-bottom_small">
                <div class="slds-grid slds-gutters slds-wrap">
                    <div class="slds-col slds-size_1-of-1 slds-medium-size_8-of-12">
                        <lightning-input type="search" label="Search Buyers" placeholder="Search by name, company, or city..." value={searchTerm} onchange={handleSearchChange}></lightning-input>
                    </div>
                    <div class="slds-col slds-size_1-of-1 slds-medium-size_4-of-12 slds-align-bottom slds-m-top_small">
                        <lightning-button label="Reset Search" icon-name="utility:clear" onclick={handleResetFilters}></lightning-button>
                    </div>
                </div>
            </div>

            <div class="slds-p-around_medium">
                <lightning-datatable
                    key-field="Id"
                    data={buyers}
                    columns={columns}
                    onrowaction={handleRowAction}
                    hide-checkbox-column="true">
                </lightning-datatable>
            </div>
        </lightning-card>

        <template if:true={isModalOpen}>
            <section role="dialog" tabindex="-1" class="slds-modal slds-fade-in-open slds-modal_medium">
                <div class="slds-modal__container">
                    <header class="slds-modal__header modal-green-header">
                        <h2 class="slds-text-heading_medium">{modalTitle}</h2>
                    </header>
                    <div class="slds-modal__content slds-p-around_medium">
                        <div class="slds-grid slds-wrap slds-gutters">
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input label="Buyer Contact / Agency Name" required value={currentBuyer.Name} data-field="Name" onchange={handleFieldChange}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input label="Company / Entity Name" value={currentBuyer.Company_Name__c} data-field="Company_Name__c" onchange={handleFieldChange}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input type="tel" label="Phone Number" required value={currentBuyer.Phone__c} data-field="Phone__c" onchange={handleFieldChange}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input type="email" label="Email Address" value={currentBuyer.Email__c} data-field="Email__c" onchange={handleFieldChange}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-combobox label="Buyer Type" value={currentBuyer.Buyer_Type__c} options={buyerTypeOptions} data-field="Buyer_Type__c" onchange={handleFieldChange}></lightning-combobox>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input label="Trading Hub / City" required value={currentBuyer.City__c} data-field="City__c" onchange={handleFieldChange}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-combobox label="Credit / Payment Rating" value={currentBuyer.Rating__c} options={ratingOptions} data-field="Rating__c" onchange={handleFieldChange}></lightning-combobox>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-combobox label="Status" value={currentBuyer.Status__c} options={statusOptions} data-field="Status__c" onchange={handleFieldChange}></lightning-combobox>
                            </div>
                        </div>
                    </div>
                    <footer class="slds-modal__footer">
                        <lightning-button label="Cancel" onclick={handleCloseModal} class="slds-m-right_small"></lightning-button>
                        <lightning-button variant="brand" label="Save Buyer" onclick={handleSaveBuyer}></lightning-button>
                    </footer>
                </div>
            </section>
            <div class="slds-backdrop slds-backdrop_open"></div>
        </template>
    </div>
</template>`;

const fmsBuyerManagerJs = `import { LightningElement, track, wire } from 'lwc';
import getBuyers from '@salesforce/apex/FarmManagementController.getBuyers';
import saveBuyer from '@salesforce/apex/FarmManagementController.saveBuyer';
import deleteBuyer from '@salesforce/apex/FarmManagementController.deleteBuyer';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

const ACTIONS = [
    { label: 'Edit', name: 'edit', iconName: 'utility:edit' },
    { label: 'Delete', name: 'delete', iconName: 'utility:delete' }
];

const COLUMNS = [
    { label: 'Buyer Name', fieldName: 'Name', type: 'text' },
    { label: 'Company', fieldName: 'Company_Name__c', type: 'text' },
    { label: 'Phone', fieldName: 'Phone__c', type: 'phone' },
    { label: 'Buyer Type', fieldName: 'Buyer_Type__c', type: 'text' },
    { label: 'City', fieldName: 'City__c', type: 'text' },
    { label: 'Rating', fieldName: 'Rating__c', type: 'text' },
    { label: 'Status', fieldName: 'Status__c', type: 'text' },
    { type: 'action', typeAttributes: { rowActions: ACTIONS } }
];

export default class FmsBuyerManager extends LightningElement {
    @track buyers = [];
    @track searchTerm = '';
    @track isModalOpen = false;
    @track modalTitle = 'Add Buyer Agency';
    @track currentBuyer = {};

    columns = COLUMNS;
    wiredBuyersResult;

    buyerTypeOptions = [
        { label: 'Government Mandi / APMC', value: 'Government Mandi / APMC' },
        { label: 'Wholesale Trader', value: 'Wholesale Trader' },
        { label: 'Retail Supermarket Chain', value: 'Retail Supermarket Chain' },
        { label: 'Food Processing Industry', value: 'Food Processing Industry' },
        { label: 'Direct Exporter', value: 'Direct Exporter' }
    ];

    ratingOptions = [
        { label: '5 Star - Prompt Pay', value: '5 Star - Prompt Pay' },
        { label: '4 Star - Reliable', value: '4 Star - Reliable' },
        { label: '3 Star - Regular', value: '3 Star - Regular' },
        { label: '2 Star - Delayed Pay', value: '2 Star - Delayed Pay' }
    ];

    statusOptions = [
        { label: 'Active', value: 'Active' },
        { label: 'Pending Verification', value: 'Pending Verification' },
        { label: 'Suspended', value: 'Suspended' }
    ];

    @wire(getBuyers, { searchTerm: '$searchTerm', typeFilter: 'All' })
    wiredBuyers(result) {
        this.wiredBuyersResult = result;
        if (result.data) {
            this.buyers = result.data;
        }
    }

    handleSearchChange(event) { this.searchTerm = event.target.value; }
    handleResetFilters() { this.searchTerm = ''; }

    handleOpenNewModal() {
        this.currentBuyer = {
            Name: '',
            Company_Name__c: '',
            Phone__c: '',
            Email__c: '',
            Buyer_Type__c: 'Wholesale Trader',
            City__c: '',
            Rating__c: '5 Star - Prompt Pay',
            Status__c: 'Active'
        };
        this.modalTitle = 'Add Buyer Agency';
        this.isModalOpen = true;
    }

    handleCloseModal() { this.isModalOpen = false; }

    handleFieldChange(event) {
        const field = event.target.dataset.field;
        this.currentBuyer[field] = event.target.value;
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        if (actionName === 'edit') {
            this.currentBuyer = { ...row };
            this.modalTitle = 'Edit Buyer: ' + row.Name;
            this.isModalOpen = true;
        } else if (actionName === 'delete') {
            this.handleDelete(row.Id);
        }
    }

    async handleSaveBuyer() {
        if (!this.currentBuyer.Name || !this.currentBuyer.Phone__c || !this.currentBuyer.City__c) {
            this.showToast('Validation Error', 'Buyer Name, Phone, and City are required.', 'error');
            return;
        }

        try {
            await saveBuyer({ buyerRecord: this.currentBuyer });
            this.showToast('Success', 'Buyer record saved', 'success');
            this.isModalOpen = false;
            refreshApex(this.wiredBuyersResult);
        } catch (error) {
            this.showToast('Error', error.body ? error.body.message : error.message, 'error');
        }
    }

    async handleDelete(buyerId) {
        try {
            await deleteBuyer({ buyerId: buyerId });
            this.showToast('Success', 'Buyer record deleted', 'success');
            refreshApex(this.wiredBuyersResult);
        } catch (error) {
            this.showToast('Error', error.body ? error.body.message : error.message, 'error');
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}`;

writeFile('force-app/main/default/lwc/fmsBuyerManager/fmsBuyerManager.html', fmsBuyerManagerHtml);
writeFile('force-app/main/default/lwc/fmsBuyerManager/fmsBuyerManager.js', fmsBuyerManagerJs);
writeFile('force-app/main/default/lwc/fmsBuyerManager/fmsBuyerManager.css', fmsFarmManagerCss);
writeFile('force-app/main/default/lwc/fmsBuyerManager/fmsBuyerManager.js-meta.xml', getLwcMetaXml('FMS Buyer Manager', 'Produce Procurement Buyers Directory'));

// --------------------------------------------------------------------------
// 6. fmsSalesManager LWC
// --------------------------------------------------------------------------
const fmsSalesManagerHtml = `<template>
    <div class="fms-container">
        <lightning-card title="Sales Transactions & Payment Invoices" icon-name="custom:custom41">
            <div slot="actions">
                <lightning-button label="Generate Invoice" icon-name="utility:add" variant="brand" onclick={handleOpenNewModal}></lightning-button>
            </div>

            <div class="slds-p-horizontal_medium slds-p-bottom_small">
                <div class="slds-grid slds-gutters slds-wrap">
                    <div class="slds-col slds-size_1-of-1 slds-medium-size_6-of-12">
                        <lightning-input type="search" label="Search Sales" placeholder="Invoice reference or buyer..." value={searchTerm} onchange={handleSearchChange}></lightning-input>
                    </div>
                    <div class="slds-col slds-size_1-of-1 slds-medium-size_4-of-12">
                        <lightning-combobox label="Payment Status Filter" value={paymentFilter} options={statusFilterOptions} onchange={handleFilterChange}></lightning-combobox>
                    </div>
                    <div class="slds-col slds-size_1-of-1 slds-medium-size_2-of-12 slds-align-bottom slds-m-top_small">
                        <lightning-button label="Reset" icon-name="utility:clear" onclick={handleResetFilters}></lightning-button>
                    </div>
                </div>
            </div>

            <div class="slds-p-around_medium">
                <lightning-datatable
                    key-field="Id"
                    data={sales}
                    columns={columns}
                    onrowaction={handleRowAction}
                    hide-checkbox-column="true">
                </lightning-datatable>
            </div>
        </lightning-card>

        <template if:true={isModalOpen}>
            <section role="dialog" tabindex="-1" class="slds-modal slds-fade-in-open slds-modal_medium">
                <div class="slds-modal__container">
                    <header class="slds-modal__header modal-green-header">
                        <h2 class="slds-text-heading_medium">{modalTitle}</h2>
                    </header>
                    <div class="slds-modal__content slds-p-around_medium">
                        <div class="slds-grid slds-wrap slds-gutters">
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input label="Invoice Number" required value={currentSale.Name} data-field="Name" onchange={handleFieldChange}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input type="date" label="Transaction Date" required value={currentSale.Transaction_Date__c} data-field="Transaction_Date__c" onchange={handleFieldChange}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input type="number" step="0.01" label="Quantity Sold (Quintals)" required value={currentSale.Quantity_Sold_Quintals__c} data-field="Quantity_Sold_Quintals__c" onchange={handleCalcFieldChange}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input type="number" step="0.01" label="Price per Quintal (₹)" required value={currentSale.Price_Per_Quintal__c} data-field="Price_Per_Quintal__c" onchange={handleCalcFieldChange}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input type="number" label="Calculated Total Amount (₹)" readonly value={currentSale.Total_Amount__c}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input type="number" step="0.01" label="Amount Paid by Buyer (₹)" value={currentSale.Amount_Paid__c} data-field="Amount_Paid__c" onchange={handleCalcFieldChange}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-input type="number" label="Balance Due / Pending (₹)" readonly value={currentSale.Pending_Amount__c}></lightning-input>
                            </div>
                            <div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2">
                                <lightning-combobox label="Payment Method" value={currentSale.Payment_Method__c} options={paymentMethodOptions} data-field="Payment_Method__c" onchange={handleFieldChange}></lightning-combobox>
                            </div>
                        </div>
                    </div>
                    <footer class="slds-modal__footer">
                        <lightning-button label="Cancel" onclick={handleCloseModal} class="slds-m-right_small"></lightning-button>
                        <lightning-button variant="brand" label="Save Transaction" onclick={handleSaveSale}></lightning-button>
                    </footer>
                </div>
            </section>
            <div class="slds-backdrop slds-backdrop_open"></div>
        </template>
    </div>
</template>`;

const fmsSalesManagerJs = `import { LightningElement, track, wire } from 'lwc';
import getSalesTransactions from '@salesforce/apex/FarmManagementController.getSalesTransactions';
import saveSalesTransaction from '@salesforce/apex/FarmManagementController.saveSalesTransaction';
import deleteSalesTransaction from '@salesforce/apex/FarmManagementController.deleteSalesTransaction';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

const ACTIONS = [
    { label: 'Edit', name: 'edit', iconName: 'utility:edit' },
    { label: 'Delete', name: 'delete', iconName: 'utility:delete' }
];

const COLUMNS = [
    { label: 'Invoice No', fieldName: 'Name', type: 'text' },
    { label: 'Date', fieldName: 'Transaction_Date__c', type: 'date' },
    { label: 'Qty (Qtl)', fieldName: 'Quantity_Sold_Quintals__c', type: 'number' },
    { label: 'Rate (₹)', fieldName: 'Price_Per_Quintal__c', type: 'currency' },
    { label: 'Total (₹)', fieldName: 'Total_Amount__c', type: 'currency' },
    { label: 'Paid (₹)', fieldName: 'Amount_Paid__c', type: 'currency' },
    { label: 'Pending (₹)', fieldName: 'Pending_Amount__c', type: 'currency' },
    { label: 'Status', fieldName: 'Payment_Status__c', type: 'text' },
    { type: 'action', typeAttributes: { rowActions: ACTIONS } }
];

export default class FmsSalesManager extends LightningElement {
    @track sales = [];
    @track searchTerm = '';
    @track paymentFilter = 'All';
    @track isModalOpen = false;
    @track modalTitle = 'Generate Invoice';
    @track currentSale = {};

    columns = COLUMNS;
    wiredSalesResult;

    statusFilterOptions = [
        { label: 'All Statuses', value: 'All' },
        { label: 'Payment Completed', value: 'Payment Completed' },
        { label: 'Partial Payment', value: 'Partial Payment' },
        { label: 'Pending Payment', value: 'Pending Payment' },
        { label: 'Overdue', value: 'Overdue' }
    ];

    paymentMethodOptions = [
        { label: 'Bank NEFT / RTGS', value: 'Bank NEFT / RTGS' },
        { label: 'UPI / IMPS', value: 'UPI / IMPS' },
        { label: 'Cheque', value: 'Cheque' },
        { label: 'Cash / Mandi Receipt', value: 'Cash / Mandi Receipt' }
    ];

    @wire(getSalesTransactions, { searchTerm: '$searchTerm', paymentStatusFilter: '$paymentFilter' })
    wiredSales(result) {
        this.wiredSalesResult = result;
        if (result.data) {
            this.sales = result.data;
        }
    }

    handleSearchChange(event) { this.searchTerm = event.target.value; }
    handleFilterChange(event) { this.paymentFilter = event.target.value; }
    handleResetFilters() {
        this.searchTerm = '';
        this.paymentFilter = 'All';
    }

    handleOpenNewModal() {
        this.currentSale = {
            Name: 'INV-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900),
            Transaction_Date__c: new Date().toISOString().slice(0, 10),
            Quantity_Sold_Quintals__c: 50,
            Price_Per_Quintal__c: 3500,
            Total_Amount__c: 175000,
            Amount_Paid__c: 100000,
            Pending_Amount__c: 75000,
            Payment_Method__c: 'Bank NEFT / RTGS'
        };
        this.modalTitle = 'Generate Invoice';
        this.isModalOpen = true;
    }

    handleCloseModal() { this.isModalOpen = false; }

    handleFieldChange(event) {
        const field = event.target.dataset.field;
        this.currentSale[field] = event.target.value;
    }

    handleCalcFieldChange(event) {
        const field = event.target.dataset.field;
        this.currentSale[field] = parseFloat(event.target.value) || 0;
        
        const qty = parseFloat(this.currentSale.Quantity_Sold_Quintals__c) || 0;
        const rate = parseFloat(this.currentSale.Price_Per_Quintal__c) || 0;
        const paid = parseFloat(this.currentSale.Amount_Paid__c) || 0;
        
        const total = qty * rate;
        this.currentSale.Total_Amount__c = total;
        this.currentSale.Pending_Amount__c = Math.max(0, total - paid);
        this.currentSale = { ...this.currentSale };
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        if (actionName === 'edit') {
            this.currentSale = { ...row };
            this.modalTitle = 'Edit Invoice: ' + row.Name;
            this.isModalOpen = true;
        } else if (actionName === 'delete') {
            this.handleDelete(row.Id);
        }
    }

    async handleSaveSale() {
        if (!this.currentSale.Name || !this.currentSale.Quantity_Sold_Quintals__c || !this.currentSale.Price_Per_Quintal__c) {
            this.showToast('Validation Error', 'Invoice Reference, Quantity, and Price per Quintal are mandatory.', 'error');
            return;
        }
        if (this.currentSale.Amount_Paid__c > this.currentSale.Total_Amount__c) {
            this.showToast('Validation Error', 'Amount Paid cannot exceed Total Amount.', 'error');
            return;
        }

        try {
            await saveSalesTransaction({ saleRecord: this.currentSale });
            this.showToast('Success', 'Sales invoice saved successfully', 'success');
            this.isModalOpen = false;
            refreshApex(this.wiredSalesResult);
        } catch (error) {
            this.showToast('Error', error.body ? error.body.message : error.message, 'error');
        }
    }

    async handleDelete(saleId) {
        try {
            await deleteSalesTransaction({ saleId: saleId });
            this.showToast('Success', 'Invoice record deleted', 'success');
            refreshApex(this.wiredSalesResult);
        } catch (error) {
            this.showToast('Error', error.body ? error.body.message : error.message, 'error');
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}`;

writeFile('force-app/main/default/lwc/fmsSalesManager/fmsSalesManager.html', fmsSalesManagerHtml);
writeFile('force-app/main/default/lwc/fmsSalesManager/fmsSalesManager.js', fmsSalesManagerJs);
writeFile('force-app/main/default/lwc/fmsSalesManager/fmsSalesManager.css', fmsFarmManagerCss);
writeFile('force-app/main/default/lwc/fmsSalesManager/fmsSalesManager.js-meta.xml', getLwcMetaXml('FMS Sales Manager', 'Sales Transactions and Pending Payment Tracking'));

// --------------------------------------------------------------------------
// 7. fmsAppContainer Master LWC
// --------------------------------------------------------------------------
const fmsAppContainerHtml = `<template>
    <div class="fms-master-app">
        <!-- Agriculture Theme Header -->
        <header class="fms-header">
            <div class="fms-header-left">
                <div class="fms-logo-badge">
                    <lightning-icon icon-name="custom:custom5" size="medium" variant="inverse"></lightning-icon>
                </div>
                <div>
                    <h1 class="fms-app-title">KisanSeva - Farm Management System</h1>
                    <p class="fms-app-subtitle">Salesforce Powered Agricultural Intelligence & Crop Commerce Platform</p>
                </div>
            </div>

            <!-- Role Selector & Status Indicator -->
            <div class="fms-header-right">
                <span class="role-badge">
                    <lightning-icon icon-name="utility:user" size="x-small" class="slds-m-right_xx-small"></lightning-icon>
                    Active Role: <strong>{currentRole}</strong>
                </span>
                <lightning-button-menu alternative-text="Switch Role" variant="border-filled" icon-name="utility:switch" onselect={handleRoleSelect}>
                    <lightning-menu-item value="Administrator" label="Administrator (Full Access)" checked={isAdmin}></lightning-menu-item>
                    <lightning-menu-item value="Farm Manager" label="Farm Manager (Operations)" checked={isManager}></lightning-menu-item>
                    <lightning-menu-item value="Field Officer" label="Field Officer / Farmer (Restricted)" checked={isFieldOfficer}></lightning-menu-item>
                </lightning-button-menu>
            </div>
        </header>

        <!-- Main Tabbed Navigation -->
        <lightning-tabset variant="scoped" active-tab-value={activeTab}>
            <lightning-tab label="📊 Overview Dashboard" value="dashboard">
                <c-fms-dashboard></c-fms-dashboard>
            </lightning-tab>

            <lightning-tab label="🏡 Farm Facilities" value="farms">
                <c-fms-farm-manager></c-fms-farm-manager>
            </lightning-tab>

            <lightning-tab label="👨‍🌾 Farmer Directory" value="farmers">
                <c-fms-farmer-manager></c-fms-farmer-manager>
            </lightning-tab>

            <lightning-tab label="🌾 Crop Cultivation" value="crops">
                <c-fms-crop-manager></c-fms-crop-manager>
            </lightning-tab>

            <template if:false={isFieldOfficer}>
                <lightning-tab label="🏢 Procurement Buyers" value="buyers">
                    <c-fms-buyer-manager></c-fms-buyer-manager>
                </lightning-tab>

                <lightning-tab label="💰 Sales & Payments" value="sales">
                    <c-fms-sales-manager></c-fms-sales-manager>
                </lightning-tab>
            </template>
        </lightning-tabset>
    </div>
</template>`;

const fmsAppContainerJs = `import { LightningElement, track } from 'lwc';

export default class FmsAppContainer extends LightningElement {
    @track activeTab = 'dashboard';
    @track currentRole = 'Administrator';

    get isAdmin() { return this.currentRole === 'Administrator'; }
    get isManager() { return this.currentRole === 'Farm Manager'; }
    get isFieldOfficer() { return this.currentRole === 'Field Officer'; }

    handleRoleSelect(event) {
        this.currentRole = event.detail.value;
    }
}`;

const fmsAppContainerCss = `.fms-master-app {
    background-color: #f1f8e9;
    min-height: 100vh;
    padding: 1rem;
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
}

.fms-header {
    background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%);
    color: #ffffff;
    border-radius: 12px;
    padding: 1.25rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4px 15px rgba(27, 94, 32, 0.25);
    margin-bottom: 1.25rem;
}

.fms-header-left {
    display: flex;
    align-items: center;
}

.fms-logo-badge {
    background: rgba(255, 255, 255, 0.15);
    padding: 0.75rem;
    border-radius: 12px;
    margin-right: 1.25rem;
    backdrop-filter: blur(4px);
}

.fms-app-title {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.5px;
    margin: 0;
    color: #ffffff;
}

.fms-app-subtitle {
    font-size: 0.85rem;
    color: #c8e6c9;
    margin: 0.25rem 0 0 0;
}

.fms-header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.role-badge {
    background: rgba(255, 255, 255, 0.2);
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
}`;

writeFile('force-app/main/default/lwc/fmsAppContainer/fmsAppContainer.html', fmsAppContainerHtml);
writeFile('force-app/main/default/lwc/fmsAppContainer/fmsAppContainer.js', fmsAppContainerJs);
writeFile('force-app/main/default/lwc/fmsAppContainer/fmsAppContainer.css', fmsAppContainerCss);
writeFile('force-app/main/default/lwc/fmsAppContainer/fmsAppContainer.js-meta.xml', getLwcMetaXml('Farm Management Master App', 'Main application container tab for Farm Management System'));

console.log('All Lightning Web Components generated successfully.');
