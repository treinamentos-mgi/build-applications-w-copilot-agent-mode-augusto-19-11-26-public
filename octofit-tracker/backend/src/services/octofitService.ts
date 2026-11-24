import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Informe os dados da atividade'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as {
    userId?: unknown;
    teamId?: unknown;
    type?: unknown;
    minutes?: unknown;
  };

  if (
    typeof userId !== 'string'
    || typeof teamId !== 'string'
    || typeof type !== 'string'
    || !type.trim()
    || typeof minutes !== 'number'
    || !Number.isFinite(minutes)
    || minutes <= 0
  ) {
    throw Object.assign(new Error('Informe pessoa, equipe, tipo e minutos válidos'), { status: 400 });
  }

  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(teamId)) {
    throw Object.assign(new Error('Pessoa ou equipe possui um identificador inválido'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.findById(userId).lean(),
    Team.findById(teamId).lean(),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('Pessoa ou equipe não encontrada'), { status: 404 });
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Informe os dados da equipe'), { status: 400 });
  }

  const { name, mascot, members } = input as {
    name?: unknown;
    mascot?: unknown;
    members?: unknown;
  };
  if (typeof name !== 'string' || !name.trim() || typeof mascot !== 'string' || !mascot.trim()) {
    throw Object.assign(new Error('Informe nome e mascote válidos para a equipe'), { status: 400 });
  }

  const memberIds = members === undefined ? [] : members;
  if (!Array.isArray(memberIds) || memberIds.some((id) => typeof id !== 'string' || !mongoose.isValidObjectId(id))) {
    throw Object.assign(new Error('Informe integrantes válidos para a equipe'), { status: 400 });
  }

  const existingMembers = await User.find({ _id: { $in: memberIds } }).select('_id').lean();
  if (existingMembers.length !== memberIds.length) {
    throw Object.assign(new Error('Um ou mais integrantes não foram encontrados'), { status: 404 });
  }

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: existingMembers.map((member) => member._id),
  });
  await User.updateMany({ _id: { $in: existingMembers.map((member) => member._id) } }, { $set: { team: team._id } });
  return team;
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
  ]);
  if (totals.length === 0) return [];

  const teams = await Team.find({
    _id: { $in: totals.map((total) => total._id) },
  }).lean();
  const teamNames = new Map(teams.map((team) => [team._id.toString(), team.name]));

  return totals
    .map((total) => ({
      teamName: teamNames.get(total._id.toString()) ?? 'Equipe desconhecida',
      totalPoints: total.totalPoints,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('Pessoa não encontrada'), { status: 404 });
  }

  let focus = user.fitnessGoal;
  if (!['endurance', 'strength', 'mobility'].includes(focus)) {
    const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
    if (recentActivity?.type === 'strength') focus = 'strength';
    else if (recentActivity?.type === 'run' || recentActivity?.type === 'walk' || recentActivity?.type === 'cycle') focus = 'endurance';
  }

  const workouts = await Workout.find({ focus }).lean();
  return workouts.map((workout) => ({
    ...workout,
    reason: focus === 'strength'
      ? 'Compatível com seu objetivo e padrão de atividades de força'
      : focus === 'mobility'
        ? 'Compatível com seu objetivo de mobilidade e atividade física'
        : 'Compatível com seu objetivo de resistência e sua atividade de corrida',
  }));
}

export { User };
