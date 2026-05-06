$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$wb = $excel.Workbooks.Open("c:\Users\yosis\Downloads\Precioled\Escudos Equipos y URLS.xlsx")
$ws = $wb.Sheets.Item(1)
$rows = $ws.UsedRange.Rows.Count
$cols = $ws.UsedRange.Columns.Count
$output = "Rows: $rows, Cols: $cols`n"
for ($r = 1; $r -le $rows; $r++) {
    $line = ""
    for ($c = 1; $c -le $cols; $c++) {
        $val = $ws.Cells.Item($r, $c).Text
        $line += $val + "|"
    }
    $output += $line + "`n"
}
$wb.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
$output | Out-File -FilePath "c:\Users\yosis\Downloads\Precioled\excel_data.txt" -Encoding utf8
Write-Host "Done. Wrote $rows rows."
