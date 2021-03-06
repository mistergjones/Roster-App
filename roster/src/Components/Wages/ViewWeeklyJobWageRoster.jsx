import React, { useEffect, useState } from "react";
import useApi from "../../hooks/useApi";
import LeftSidebar from "../LeftSidebar";
import { MDBContainer, MDBRow, MDBCol, MDBTable } from "mdbreact";
import ReactToPdf from "react-to-pdf";
import { SplitButton, Dropdown, ButtonGroup, Button } from "react-bootstrap";
// import "../StaffListScreen.css";
import calculateCorrectJobWagesPay from "../../lib/calculateCorrectPayWeeklyJobTitleRoster";
import calculateReportTotals from "../../lib/calculateReportTotals";
import calculateHeadings from "../../lib/calculateHeadingsForReports.js";

const ref = React.createRef();
const options = {
    orientation: "potrait",
    unit: "in",
    format: [6000, 1400],
};

function ViewWeeklyJobWageRoster(props) {
    const { data, request: getDesiredWeekJobWages } = useApi(
        `http://localhost:9000/wages/jobtitle/${props.match.params.rosterID}`
    );

    useEffect(() => {
        getDesiredWeekJobWages();
        // setTotalHour();
    }, []);
    console.log("**************************");
    console.log(data);

    // const tableHeader = [];
    let count = 0;

    // data.map((item) => {
    //     Object.keys(item).forEach((key, value) => {
    //         console.log(key, value);
    //     });
    // });

    // data.map((item) => {
    //     Object.values(item).map((value, index) => {
    //         console.log(value);
    //     });
    // });

    // take a copy and clone the data object
    var clonedObject = Object.assign({}, data);
    var data2 = calculateCorrectJobWagesPay(clonedObject);

    // determine the table headings
    var tableHeader = calculateHeadings(data2);
    // calculate TOTALS for the bottom of the report
    var reportTotals = calculateReportTotals(data2);
    // var tableHeader = calculateHeadings(newDataObject);
    var tableHeader = [
        "Roster ID",
        "Job Title",
        "Hourly $ Rate",
        "Rostered Hours",
        "Break Time",
        "Actual Work Time",
        "Total Pay",
    ];

    return (
        <MDBContainer fluid size="12" sm="12" md="12" lg="12" xl="12">
            <MDBRow center>
                <MDBCol sm="12" md="12" lg="12" xl="12">
                    <LeftSidebar />
                </MDBCol>
            </MDBRow>
            <MDBRow>
                {/* <MDBCol size="12" sm="4" md="4" lg="2" xl="2"></MDBCol> */}
                <MDBCol size="12" sm="12" md="12" lg="12" xl="12">
                    <MDBRow>
                        <MDBCol>
                            <div style={{ width: 100 + "vw" }}>
                                <ReactToPdf
                                    targetRef={ref}
                                    filename="roster.pdf"
                                    options={options}
                                    x={1}
                                    y={0.1}
                                    scale={1.5}
                                >
                                    {({ toPdf }) => (
                                        <Button onClick={toPdf}>
                                            Download pdf
                                        </Button>
                                    )}
                                </ReactToPdf>
                                <div style={{ width: 100 + "vw" }} ref={ref}>
                                    <MDBTable
                                        sm="12"
                                        style={{ wordBreak: "break-all" }}
                                        bordered
                                        hover
                                    >
                                        <thead>
                                            <tr>
                                                {tableHeader.map(
                                                    (tableHeading) => (
                                                        <th>{tableHeading}</th>
                                                    )
                                                )}
                                            </tr>
                                        </thead>
                                        {/* <tbody>{tableBody}</tbody> */}
                                        <tbody>
                                            {data2.map((item) => (
                                                <tr>
                                                    {Object.values(item).map(
                                                        (value, index) => (
                                                            <td>{value}</td>
                                                        )
                                                    )}
                                                </tr>
                                            ))}
                                            <tr>
                                                Total Wages:
                                                <td></td>
                                                <td></td>
                                                <td>
                                                    {
                                                        reportTotals.totalRosteredHours
                                                    }
                                                </td>
                                                <td>
                                                    {
                                                        reportTotals.totalBreakTimeHours
                                                    }
                                                </td>
                                                <td>
                                                    {
                                                        reportTotals.totalActualWorkTimeHours
                                                    }
                                                </td>
                                                <td>
                                                    ${reportTotals.totalWages}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </MDBTable>
                                </div>
                            </div>
                        </MDBCol>
                    </MDBRow>
                </MDBCol>
            </MDBRow>
            <MDBRow className="button-panel">
                <MDBCol sm="6" md="5" lg="4" xl="3">
                    <Button href="#" btn-block>
                        Publish
                    </Button>
                </MDBCol>
                <MDBCol sm="6" md="5" lg="4" xl="3">
                    <Button href="/admin" btn-block>
                        Back to Admin
                    </Button>
                </MDBCol>
            </MDBRow>
        </MDBContainer>
    );
}

export default ViewWeeklyJobWageRoster;
