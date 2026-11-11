param([Parameter(Mandatory=$true)][string]$Email)
$ErrorActionPreference='Stop'
if ($Email -notmatch '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') { throw 'Email không hợp lệ' }
$statement = "UPDATE users SET role='ROLE_ADMIN' WHERE email='" + $Email.Replace("'","''") + "';"
$statement | docker exec -i postgresql sh -c 'psql -U "$POSTGRES_USER" -d auth_service -v ON_ERROR_STOP=1'
if ($LASTEXITCODE -ne 0) { throw 'Không cấp được quyền quản lý' }
Write-Output 'Kiểm tra số tài khoản được cập nhật; đăng xuất và đăng nhập lại để lấy quyền mới.'
