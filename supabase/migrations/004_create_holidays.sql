create table da_holidays (
  date        date primary key,
  name        text not null,
  is_holiday  boolean not null,
  description text,
  year        int not null
);

create index on da_holidays (year);
