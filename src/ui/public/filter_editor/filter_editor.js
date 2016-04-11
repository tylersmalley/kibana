import angular from 'angular';
import { pull, isEmpty } from 'lodash';

import template from 'ui/filter_editor/filter_editor.html';
import IndexPatternsFieldListProvider from 'ui/index_patterns/_field_list';

import uiModules from 'ui/modules';
var module = uiModules.get('kibana');

// TODO: ability to add filter
// TODO: ability to change clause
// TODO: fade in/out filters when chang clause
// TODO: fields should be consistant with list in discover
// TODO: auto-complete for query
// TODO: fix consistancy in JSON editor (query not triggering update)

/**
 * Notes:
 *
 * Order is not preserved due to the bool filter API
 */

module.directive('filterEditor', function ($route, Private) {
  const searchSource = $route.current.locals.savedSearch.searchSource;

  return {
    restrict: 'E',
    template: template,
    scope: {
      filter: '='
    },

    link: function ($scope) {
      $scope.fields = searchSource.get('index').fields.filter(function (field) {
        return field.filterable === true;
      }).sort(function (a, b) {
        // TODO: should I just use sortBy?
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      });

      /**
       * Changes the clause for the filter
       *
       * Valid clauses are: must, must_not, should, filter
       */
      $scope.changeClause = function (fromClause, toClause, filter) {
        pull($scope.filter.bool[fromClause], filter);

        // removes clause if there are no longer any filter
        if (isEmpty($scope.filter.bool[fromClause])) {
          delete $scope.filter.bool[fromClause];
        }

        if ($scope.filter.bool[toClause] instanceof Array) {
          // append since we already have the clause defined
          $scope.filter.bool[toClause].push(filter);
        } else {
          $scope.filter.bool[toClause] = [filter];
        }
      };

      /**
       * Resets expression query on field change
       */
      $scope.changeField = function (fromField, toField, filter) {

        ensureBoolFilters();

        filter.match[toField] = filter.match[fromField];
        delete filter.match[fromField];

        // resets query
        filter.match[toField].query = '';
      };

      $scope.add = function () {
        let expression = { match: {}};
        let clauses;

        ensureBoolFilters();

        clauses = Object.keys($scope.filter.bool);
        expression.match[$scope.fields[0].name] = { query: '', type: 'phrase' };

        $scope.filter.bool[clauses[clauses.length - 1]].push(expression);
      };

      $scope.remove = function (clause, index) {
        delete $scope.filter.bool[clause][index];
      };

      /**
       * @returns {object}
       */

      function ensureBoolFilters() {

        /**
         * Normalize
         *
         * TODO: migrate to helper lib
         * TODO: enforce array for type
         */

        if ($scope.filter.query) {
          $scope.filter = {
            bool: {
              should: [
                $scope.filter.query
              ]
            }
          };
        }
      };
    }
  };
});
