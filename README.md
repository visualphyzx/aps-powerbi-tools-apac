# APS PowerBI Tools APAC

## Acknowledgement
Source codes shared in this repo were originated from open source porjects _https://github.com/autodesk-platform-services/aps-powerbi-tools_ shared by Autodesk Platform Services.

Source codes have been updated to support newly established APAC region (Australia) of Autodesk Construction Cloud. Further details are to be provided.

## BILT ANZ 2024
This repo is for sharing all source codes and context for the presentation `"Enabling 3d model viewer in Power BI using APS Viewer API"` on BILT ANZ 2024

## Content

Collection of tools for accessing [Autodesk Platform Services](https://aps.autodesk.com) design data - 2D/3D views as well as element properties - from [Power BI](https://powerbi.com) reports.

![Screenshot](./screenshot.png)

### Tools

- aps-viewer-visual-apac - Power BI Custom Visual to integrate APS Model Viewer
- aps-props-connector-apac - Custom Data Connector used by Power BI to connect ACC model to extract modeld properties using [APS Model Derivative API](https://aps.autodesk.com/developer/overview/model-derivative-api).
- aps-shares-app - Supporting Power BI with connection to models on ACC

### Major Updates

#### 20/08/2024
- Supporting ACC APAC region (Australia) by Power BI Visual and Data Connector
- Updated development dependency to the current version
- For Power BI Visual, Colorising geometry elements based on their categories

For more information, see the README file of each individual component.

## Troubleshooting

Please contact me via apsdev.biltanz@gmail.com
Please contact Autodesk via https://aps.autodesk.com/get-help.

## License

This sample is licensed under the terms of the [MIT License](http://opensource.org/licenses/MIT). Please see the [LICENSE](LICENSE) file for more details.
