module.exports = [
    '$translate',
    '$q',
    '$filter',
    '$rootScope',
    'PostEndpoint',
    'TagEndpoint',
    'UserEndpoint',
    'FormEndpoint',
    'FormStageEndpoint',
    'Notify',
    '_',
    'moment',
function (
    $translate,
    $q,
    $filter,
    $rootScope,
    PostEndpoint,
    TagEndpoint,
    UserEndpoint,
    FormEndpoint,
    FormStageEndpoint,
    Notify,
    _,
    moment
) {
    var getCurrentStage = function (post) {
        var dfd = $q.defer();

        if (!post.form || !post.form.id) {
            // if there is no pre-defined structure in place (eg from SMS, stage is 'Structure'), and the
            // update link enables you to select a type of structure
            $translate('post.structure').then(dfd.resolve);
        } else {
            // Assume form is already loading/loaded
            FormStageEndpoint.query({formId: post.form.id}).$promise.then(function (stages) {
                // If number of completed stages matches number of stages, assume they're all complete
                if (post.completed_stages.length === stages.length) {
                    if (post.status === 'published') {
                        $translate('post.complete_published').then(dfd.resolve);
                    } else {
                        $translate('post.complete_draft').then(dfd.resolve);
                    }
                } else {
                    // Get incomplete stages
                    var incompleteStages = _.filter(stages, function (stage) {
                        return !_.contains(post.completed_stages, stage.id);
                    });

                    // Return lowest priority incomplete stage
                    dfd.resolve(incompleteStages[0].label);
                }
            });
        }

        return dfd.promise;
    };

    var visibleTo = function (post) {
        if (post.status === 'draft') {
            return 'draft';
        }

        if (!_.isEmpty(post.published_to)) {
            return post.published_to.join(', ');
        }

        return 'everyone';
    };

    // @todo move to shared service?
    var deletePost = function (post) {
        $translate('notify.post.destroy_confirm').then(function (message) {
            Notify.showConfirmAlert(message).then(function () {
                PostEndpoint.delete({ id: post.id }).$promise.then(function () {
                    $translate(
                        'notify.post.destroy_success',
                        {
                            name: $scope.post.title
                        }).then(function (message) {
                            Notify.showNotificationSlider(message);
                            $location.path('/');
                        });
                }, function (errorResponse) {
                    Notify.showApiErrors(errorResponse);
                });
            });
        });
    };

    return {
        restrict: 'E',
        replace: true,
        scope: {
            post:  '=',
            canSelect: '=',
            selectedPosts: '='
        },
        templateUrl: 'templates/posts/card.html',
        link: function ($scope) {
            $scope.visibleTo = visibleTo($scope.post);

            // Format source (fixme!)
            if ($scope.post.source == 'sms') {
                $scope.post.source = 'SMS';
            } else if ($scope.post.source) {
                // Uppercase first character
                $scope.post.source = $scope.post.source.charAt(0).toUpperCase() + $scope.post.source.slice(1);
            } else {
                $scope.post.source = 'Web';
            }

            // Load the post author
            if ($scope.post.user && $scope.post.user.id) {
                $scope.post.user = UserEndpoint.get({id: $scope.post.user.id});
            }

            // Ensure completes stages array is numeric
            $scope.post.completed_stages = $scope.post.completed_stages.map(function (stageId) {
                return parseInt(stageId);
            });

            // Replace tags with full tag object
            $scope.post.tags = $scope.post.tags.map(function (tag) {
                return TagEndpoint.get({id: tag.id, ignore403: true});
            });

            // Replace form with full object
            if ($scope.post.form) {
                FormEndpoint.get({id: $scope.post.form.id}, function (form) {
                    $scope.post.form = form;
                });
            }

            var created = moment($scope.post.created),
                weekAgo =
                now = moment();

            if (now.isSame(created, 'day')) {
                $scope.displayTime = created.fromNow();
            } else if (now.isSame(created, 'week')) {
                $scope.displayTime = created.format('LT');
            } else {
                $scope.displayTime = created.format('LL');
            }
            $scope.displayTimeFull = created.format('LLL');

            $scope.deletePost = deletePost;
        }
    };

}];
