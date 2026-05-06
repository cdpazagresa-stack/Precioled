$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$wb = $excel.Workbooks.Open("c:\Users\yosis\Downloads\Precioled\Escudos Equipos y URLS.xlsx")
$ws = $wb.Sheets.Item(1)
$rows = $ws.UsedRange.Rows.Count
$cols = $ws.UsedRange.Columns.Count
Write-Host "Rows: $rows, Cols: $cols"
for ($r = 1; $r -le [Math]::Min($rows, 120); $r++) {
    $line = ""
    for ($c = 1; $c -le $cols; $c++) {
        $val = $ws.Cells.Item($r, $c).Text
        $line += $val + "|"
    }
    Write-Host $line
}
$wb.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
