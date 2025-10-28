{
    RESIDENTIAL_LAND_USE_CODE: 1;

    source: WfState.ExpansionSource;
    target: WfState.ExpansionTarget;

    newArea: target.Parcel.Area;
    oldArea: source.Parcel.Area;
    areaDiff: round(WfState.AreaDiff, 2);
    areaDiffPercentage: WfState.AreaDiffPercentage;

    landGrade: source.Parcel.LandGrade;
    landUseCode: cis_core.GetCodedTextById(source.LandRecord.LandUseTypeId).Code;
    penaltyFactor: if(landUseCode = RESIDENTIAL_LAND_USE_CODE, 1.0/3.0, 1.0/2.0);
    penaltyFactorDisplay: if(landUseCode = RESIDENTIAL_LAND_USE_CODE, "1/3", "1/2");

    areaDiffPercentageWoPenalty: case 
        oldArea < 251: 10,
        oldArea < 501: 7,
        oldArea < 2000: 5,
        3;

    TaxPenaltyResidentialBillItemDefPart: cis_core.GetBillItemDefPartOrThrow("land-tax-penalty-residential");
    TaxPenaltyBusinessBillItemDefPart: cis_core.GetBillItemDefPartOrThrow("land-tax-penalty-business");

    LeasePenaltyBillItemDefPart: cis_core.GetBillItemDefPartOrThrow("land-lease-penality");

    penaltyBillItem: if (
        areaDiffPercentage <= areaDiffPercentageWoPenalty,
        null, 
        {
            return (switch source.LandRight?.RightType,
                "Lease": {
                    leaseRate: cis_core.GetLandLeaseRate(landGrade, landUseCode, true);

                    return switch landUseCode,
                        RESIDENTIAL_LAND_USE_CODE: {
                            penalty: round(areaDiff * leaseRate * penaltyFactor, 2);
                            return {
                                BillItemType: "Penalty",
                                ItemCode: LeasePenaltyBillItemDefPart.BillItemDef.Code,
                                Description: LeasePenaltyBillItemDefPart.Display,
                                Amount: report_util.DoubleToMoney(penalty)
                            };
                        },
                        {
                            penalty: round(areaDiff * leaseRate * penaltyFactor, 2);
                            return {
                                BillItemType: "Penalty",
                                ItemCode: LeasePenaltyBillItemDefPart.BillItemDef.Code,
                                Description: LeasePenaltyBillItemDefPart.Display,
                                Amount: report_util.DoubleToMoney(penalty)
                            };
                        };
                },
                "PerpetualUser": {
                    // Use LEASE rate for perpetual lands too (customer requirement)
                    leaseRate: cis_core.GetLandLeaseRate(landGrade, landUseCode, true);

                    return switch landUseCode,
                        RESIDENTIAL_LAND_USE_CODE: {
                            penalty: round(areaDiff * leaseRate * penaltyFactor, 2);
                            return {
                                BillItemType: "Penalty",
                                ItemCode: LeasePenaltyBillItemDefPart.BillItemDef.Code,
                                Description: LeasePenaltyBillItemDefPart.Display,
                                Amount: report_util.DoubleToMoney(penalty)
                            };
                        },
                        {
                            penalty: round(areaDiff * leaseRate * penaltyFactor, 2);
                            return {
                                BillItemType: "Penalty",
                                ItemCode: LeasePenaltyBillItemDefPart.BillItemDef.Code,
                                Description: LeasePenaltyBillItemDefPart.Display,
                                Amount: report_util.DoubleToMoney(penalty)
                            };
                        };
                },
                null);
        }
    );

    BillItems: if (penaltyBillItem != null, [penaltyBillItem], []);

    BillItemDefs: [
        { Code: "title-deed-fee", Args: null },
        { Code: "verification-service", Args: null },
        { Code: "eng-fee", Args: { Area: newArea } },
    ] + if(source.Lease != null, [{ Code: "contract-registration", Args: null }], []);

    BillDetails: [
        { DetailType: 'General', Label: 'Current Area (m²)', Value: Format(oldArea, "#,##0.00") },
        { DetailType: 'General', Label: 'New Area (m²)', Value: Format(newArea, "#,##0.00") },
        { DetailType: 'General', Label: 'Area Change (m²)', Value: Format(areaDiff, "#,##0.00") },
        { DetailType: 'General', Label: 'Area Change (%)', Value: Format(areaDiffPercentage, "#,##0.0") },
    ];

    Narrative: "";
}