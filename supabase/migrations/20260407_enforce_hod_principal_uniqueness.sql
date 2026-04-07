-- Enforce one HOD per (campus + department) and one Principal per campus
-- In this schema, campus is represented by the institute column.

create unique index if not exists uq_hod_details_institute_department
on public.hod_details (institute, department)
where institute is not null and department is not null;

create unique index if not exists uq_principal_details_institute
on public.principal_details (institute)
where institute is not null;
