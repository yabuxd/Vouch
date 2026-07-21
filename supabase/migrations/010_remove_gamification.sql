-- Remove gamification: points, streaks, leaderboards, missed-event feed, points log

drop table if exists missed_reactions cascade;
drop table if exists missed_events cascade;
drop table if exists points_log cascade;

alter table group_members drop column if exists points;
alter table group_members drop column if exists current_streak;

alter table goals drop column if exists points_value;

alter table groups drop column if exists weekly_reset_enabled;
