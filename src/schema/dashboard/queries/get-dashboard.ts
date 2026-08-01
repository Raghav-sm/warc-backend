import { GraphQLNonNull } from "graphql";

import { GetDashboardSchema } from "interfaces/dashboard";

import { withValidation } from "utils/validation";

import { DashboardType } from "..";
import { getDashboard } from "../services";

const GetDashboard = {
  type: new GraphQLNonNull(DashboardType),
  resolve: () => withValidation(getDashboard)({}, GetDashboardSchema),
};

export default GetDashboard;
