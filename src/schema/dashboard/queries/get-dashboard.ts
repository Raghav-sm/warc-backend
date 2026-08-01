import { GraphQLNonNull } from "graphql";

import { GetDashboardSchema } from "interfaces/dashboard";

import { withValidation } from "utils/validation";

import { DashboardType } from "..";
import { getDashboard } from "../services";

const GetDashboard = {
  type: new GraphQLNonNull(DashboardType),
  resolve: (_root, _args, context) =>
    withValidation(getDashboard)({ userId: context.userId }, GetDashboardSchema),
};

export default GetDashboard;
