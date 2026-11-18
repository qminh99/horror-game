param([int]$Port=0,[switch]$NoOpen)
$root=[System.IO.Path]::GetFullPath($PSScriptRoot).TrimEnd('\')
if($Port -le 0){$probe=[System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback,0);$probe.Start();$Port=([System.Net.IPEndPoint]$probe.LocalEndpoint).Port;$probe.Stop()}
$server=[System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback,$Port)
try{$server.Start()}catch{Write-Host "Could not start local game server on port $Port. Close an older server window and try again.";Read-Host 'Press Enter to close';exit 1}
$url="http://127.0.0.1:$Port/"
Write-Host "Room game is running at $url"
if(-not $NoOpen){Start-Process $url}
try{
 while($true){
  $client=$server.AcceptTcpClient()
  try{
   $stream=$client.GetStream();$reader=[System.IO.StreamReader]::new($stream,[System.Text.Encoding]::ASCII)
   $request=$reader.ReadLine();if([string]::IsNullOrWhiteSpace($request)){$client.Close();continue}
   while($true){$line=$reader.ReadLine();if([string]::IsNullOrEmpty($line)){break}}
   $parts=$request.Split(' ');$method=$parts[0];$path=([Uri]::UnescapeDataString(($parts[1] -split '\?')[0])).TrimStart('/').Replace('/',[System.IO.Path]::DirectorySeparatorChar)
   if([string]::IsNullOrWhiteSpace($path)){$path='index.html'}
   $file=[System.IO.Path]::GetFullPath((Join-Path $root $path));$prefix=$root+[System.IO.Path]::DirectorySeparatorChar
   $status='200 OK';$type='application/octet-stream';$body=[byte[]]@()
   if($method -ne 'GET'){$status='405 Method Not Allowed';$body=[System.Text.Encoding]::UTF8.GetBytes('Method not allowed')}
   elseif(-not $file.StartsWith($prefix,[System.StringComparison]::OrdinalIgnoreCase)){$status='403 Forbidden';$body=[System.Text.Encoding]::UTF8.GetBytes('Forbidden')}
   elseif(-not (Test-Path -LiteralPath $file -PathType Leaf)){$status='404 Not Found';$body=[System.Text.Encoding]::UTF8.GetBytes('File not found')}
   else{$ext=[System.IO.Path]::GetExtension($file).ToLowerInvariant();switch($ext){'.html'{$type='text/html; charset=utf-8'}'.js'{$type='text/javascript; charset=utf-8'}'.css'{$type='text/css; charset=utf-8'}'.json'{$type='application/json; charset=utf-8'}'.png'{$type='image/png'}'.jpg'{$type='image/jpeg'}'.svg'{$type='image/svg+xml'}default{$type='application/octet-stream'}};$body=[System.IO.File]::ReadAllBytes($file)}
   $header=[System.Text.Encoding]::ASCII.GetBytes("HTTP/1.1 $status`r`nContent-Type: $type`r`nContent-Length: $($body.Length)`r`nConnection: close`r`nCache-Control: no-store`r`n`r`n");$stream.Write($header,0,$header.Length);if($body.Length -gt 0){$stream.Write($body,0,$body.Length)};$stream.Flush()
  }catch{}finally{$client.Close()}
 }
}finally{$server.Stop()}
