module.exports = [
    '$scope',
    '$translate',
    '$location',
    '$controller',
    '$transition$',
    'FormEndpoint',
    'PostEndpoint',
    '$state',
function (
    $scope,
    $translate,
    $location,
    $controller,
    $transition$,
    FormEndpoint,
    PostEndpoint,
    $state
) {

    $translate('post.edit_post').then(function (title) {
        $scope.title = title;
        $scope.$emit('setPageTitle', title);
    });

    PostEndpoint.get({ id: $transition$.params().id }).$promise.then(function (post) {
        // Redirect to view if no edit permissions
        if (post.allowed_privileges.indexOf('update') === -1) {
            $state.go('posts.data.detail', {view: 'data', postId: post.id});
        }
        // Make post tags numeric
        post.tags = post.tags.map(function (tag) {
            return parseInt(tag.id);
        });
        // Ensure completes stages array is numeric
        post.completed_stages = post.completed_stages.map(function (stageId) {
            return parseInt(stageId);
        });

        if (post.form) {
            $scope.form = FormEndpoint.get({ id: post.form.id }, function (form) {
                // Set page title to post title, if there is one available.
                if (post.title && post.title.length) {
                    $translate('post.modify.edit_type', { type: form.name, title: post.title }).then(function (title) {
                        $scope.$emit('setPageTitle', title);
                    });
                }
            });
        } else {
            $state.go('posts.data.detail', {view: 'data', postId: post.id});
        }
        $scope.post = post;
    });
}];
